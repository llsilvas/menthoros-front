import { useCallback, useState } from 'react';
import { SugestaoService } from '../../../api/services/SugestaoService';
import type { SugestaoCoachOutputDto, SugestaoStatus } from '../../../types/SugestaoCoach';

export interface DecisionMessage {
  severity: 'info' | 'error';
  text: string;
}

const STATUS_LABEL_MINUSCULO: Record<SugestaoStatus, string> = {
  PENDING: 'pendente',
  APPROVED: 'aprovada',
  REJECTED: 'rejeitada',
};

/**
 * Interpreta o estado real de uma sugestão após uma falha em aprovar/rejeitar (reconsultado via
 * `detalhe`), decidindo a mensagem a exibir e se o pai deve recarregar a lista. Não distingue a
 * causa raiz do erro (422 de outra sessão vs. resposta perdida da própria mutação já comitada) —
 * o sinal que importa para o coach é o mesmo nos dois casos: a sugestão não está mais PENDING.
 */
export function resolverMensagemDecisao(
  atual: SugestaoCoachOutputDto,
  versaoLida?: number,
  acao?: 'aprovar' | 'rejeitar' | 'editar',
): {
  mensagem: DecisionMessage;
  deveNotificarPai: boolean;
} {
  if (atual.status !== 'PENDING') {
    return {
      mensagem: {
        severity: 'info',
        text: `Esta sugestão não está mais pendente: está ${STATUS_LABEL_MINUSCULO[atual.status] ?? atual.status}.`,
      },
      deveNotificarPai: true,
    };
  }
  if (versaoLida !== undefined && atual.versao !== versaoLida) {
    return {
      mensagem: {
        severity: 'info',
        text: 'Esta sugestão mudou desde que você abriu — o texto exibido agora é a versão atual.',
      },
      deveNotificarPai: false,
    };
  }
  return {
    mensagem: {
      severity: 'error',
      text: acao === 'editar' ? 'Não foi possível salvar a edição. Tente novamente.' : 'Não foi possível decidir. Tente novamente.',
    },
    deveNotificarPai: false,
  };
}

/**
 * Aprova/rejeita uma `SugestaoCoach`, com reconciliação em caso de falha: em vez de assumir que a
 * sugestão continua PENDING, reconsulta o estado real (a mutação pode ter comitado no servidor
 * mesmo com erro de transporte, ou já ter sido decidida por outra sessão).
 */
/** Resultado de uma ação: `conflito` = a sugestão mudou em outra sessão (o texto atual já foi entregue a `onResultado`). */
export type ResultadoAcao = 'ok' | 'conflito' | 'falha';

export function useSugestaoDecisao(onDecisao?: () => void) {
  const [deciding, setDeciding] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState<DecisionMessage | null>(null);

  const executar = useCallback(
    async (
      id: string,
      acao: 'aprovar' | 'rejeitar' | 'editar',
      chamada: () => Promise<SugestaoCoachOutputDto>,
      onResultado: (detalhe: SugestaoCoachOutputDto) => void,
      versaoLida?: number,
    ): Promise<ResultadoAcao> => {
      setDeciding(true);
      setDecisionMessage(null);

      try {
        const atualizado = await chamada();
        onResultado(atualizado);
        // Editar não muda o status: a lista do pai não precisa recarregar.
        if (acao !== 'editar') onDecisao?.();
        return 'ok';
      } catch (err) {
        console.error(`Falha ao ${acao} sugestão ${id}`, err);
        try {
          const atual = await SugestaoService.detalhe(id);
          onResultado(atual);
          const { mensagem, deveNotificarPai } = resolverMensagemDecisao(atual, versaoLida, acao);
          setDecisionMessage(mensagem);
          if (deveNotificarPai) onDecisao?.();
          return versaoLida !== undefined && atual.versao !== versaoLida ? 'conflito' : 'falha';
        } catch (reconsultaErr) {
          console.error(`Falha ao reconsultar sugestão ${id} após erro em ${acao}`, reconsultaErr);
          setDecisionMessage({ severity: 'error', text: 'Não foi possível confirmar — recarregue.' });
          return 'falha';
        }
      } finally {
        setDeciding(false);
      }
    },
    [onDecisao],
  );

  const decidir = useCallback(
    (
      id: string,
      acao: 'aprovar' | 'rejeitar',
      onResultado: (detalhe: SugestaoCoachOutputDto) => void,
      rejectionReason?: string,
      versaoLida?: number,
    ) =>
      executar(
        id,
        acao,
        () =>
          acao === 'rejeitar'
            ? SugestaoService.rejeitar(id, rejectionReason, versaoLida)
            : SugestaoService.aprovar(id, versaoLida),
        onResultado,
        versaoLida,
      ),
    [executar],
  );

  const editar = useCallback(
    (id: string, summary: string, versaoLida: number, onResultado: (detalhe: SugestaoCoachOutputDto) => void) =>
      executar(id, 'editar', () => SugestaoService.editar(id, summary, versaoLida), onResultado, versaoLida),
    [executar],
  );

  const resetDecisionMessage = useCallback(() => setDecisionMessage(null), []);

  return { decidir, editar, deciding, decisionMessage, resetDecisionMessage };
}
