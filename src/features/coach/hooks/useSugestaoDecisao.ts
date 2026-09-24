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
export function resolverMensagemDecisao(atual: SugestaoCoachOutputDto): {
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
  return {
    mensagem: { severity: 'error', text: 'Não foi possível decidir. Tente novamente.' },
    deveNotificarPai: false,
  };
}

/**
 * Aprova/rejeita uma `SugestaoCoach`, com reconciliação em caso de falha: em vez de assumir que a
 * sugestão continua PENDING, reconsulta o estado real (a mutação pode ter comitado no servidor
 * mesmo com erro de transporte, ou já ter sido decidida por outra sessão).
 */
export function useSugestaoDecisao(onDecisao?: () => void) {
  const [deciding, setDeciding] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState<DecisionMessage | null>(null);

  const decidir = useCallback(
    async (
      id: string,
      acao: 'aprovar' | 'rejeitar',
      onResultado: (detalhe: SugestaoCoachOutputDto) => void,
    ) => {
      setDeciding(true);
      setDecisionMessage(null);

      try {
        const atualizado = await SugestaoService[acao](id);
        onResultado(atualizado);
        onDecisao?.();
      } catch (err) {
        console.error(`Falha ao ${acao} sugestão ${id}`, err);
        try {
          const atual = await SugestaoService.detalhe(id);
          onResultado(atual);
          const { mensagem, deveNotificarPai } = resolverMensagemDecisao(atual);
          setDecisionMessage(mensagem);
          if (deveNotificarPai) onDecisao?.();
        } catch (reconsultaErr) {
          console.error(`Falha ao reconsultar sugestão ${id} após erro em ${acao}`, reconsultaErr);
          setDecisionMessage({ severity: 'error', text: 'Não foi possível confirmar — recarregue.' });
        }
      } finally {
        setDeciding(false);
      }
    },
    [onDecisao],
  );

  const resetDecisionMessage = useCallback(() => setDecisionMessage(null), []);

  return { decidir, deciding, decisionMessage, resetDecisionMessage };
}
