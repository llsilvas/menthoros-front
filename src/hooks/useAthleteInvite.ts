import { useCallback, useState } from 'react';
import { AthleteInviteError, AthleteInviteService } from '../services/AthleteInviteService';
import type { AthleteInviteAcceptInput, AthleteInviteLookup } from '../types/AthleteInvite';

export type AthleteInviteStatus = 'idle' | 'submitting' | 'success' | 'error';

export type ConviteAtletaStatus = 'ocioso' | 'carregando' | 'valido' | 'invalido';

export interface ConviteAtletaState {
  status: ConviteAtletaStatus;
  dados: AthleteInviteLookup | null;
}

/**
 * Consulta e aceite do convite de atleta. O aceite é quem cria a conta (não há sessão antes dele),
 * então não há chave de idempotência aqui: o backend resolve o duplo submit com claim atômico do
 * token — o segundo POST recebe 410 e a mensagem orienta a fazer login.
 */
export function useAthleteInvite() {
  const [status, setStatus] = useState<AthleteInviteStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [convite, setConvite] = useState<ConviteAtletaState>({ status: 'ocioso', dados: null });

  /** Consulta o convite do link. 404 em qualquer forma vira `invalido` — o motivo não é público. */
  const consultarConvite = useCallback(async (token: string) => {
    setConvite({ status: 'carregando', dados: null });
    try {
      const dados = await AthleteInviteService.consultarConvite(token);
      setConvite({ status: 'valido', dados });
    } catch {
      setConvite({ status: 'invalido', dados: null });
    }
  }, []);

  const aceitar = useCallback(async (input: AthleteInviteAcceptInput) => {
    setStatus('submitting');
    setError(null);
    try {
      await AthleteInviteService.aceitar(input);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError(mensagemErro(e));
    }
  }, []);

  return { status, error, convite, consultarConvite, aceitar };
}

function mensagemErro(e: unknown): string {
  if (e instanceof AthleteInviteError) {
    if (e.status === 400) {
      return 'Verifique os dados informados e tente novamente.';
    }
    if (e.status === 404 || e.status === 410) {
      return 'Este convite não é mais válido. Se você já criou sua conta, faça login; senão, peça um novo convite ao seu treinador.';
    }
    if (e.status === 409) {
      return 'Este e-mail já possui conta, ou o atleta já está vinculado. Tente fazer login — ou fale com o seu treinador.';
    }
    if (e.status === 429) {
      return 'Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.';
    }
    if (e.status === 502 || e.status === 503) {
      return 'Não conseguimos concluir agora. Tente novamente em alguns instantes.';
    }
    return 'Não foi possível concluir agora. Tente novamente em instantes.';
  }
  return 'Falha de conexão. Verifique sua internet e tente novamente.';
}
