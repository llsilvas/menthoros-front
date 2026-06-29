import { useCallback, useState } from 'react';
import { WaitlistError, WaitlistService } from '../services/WaitlistService';
import type { WaitlistInput } from '../types/Waitlist';

export type WaitlistStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Gerencia o envio da inscrição na waitlist, expondo estado e mensagem de erro.
 * Os valores do formulário permanecem na página em caso de erro (o hook não os toca).
 */
export function useWaitlist() {
  const [status, setStatus] = useState<WaitlistStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const inscrever = useCallback(async (input: WaitlistInput) => {
    setStatus('submitting');
    setError(null);
    try {
      await WaitlistService.inscrever(input);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError(mensagemErro(e));
    }
  }, []);

  return { status, error, inscrever };
}

function mensagemErro(e: unknown): string {
  if (e instanceof WaitlistError) {
    if (e.status === 400) {
      return 'Verifique os dados informados e tente novamente.';
    }
    if (e.status === 429) {
      return 'Muitas tentativas em sequência. Aguarde um instante e tente novamente.';
    }
    return 'Não foi possível concluir agora. Tente novamente em instantes.';
  }
  // fetch rejeita (sem resposta) em falha de rede
  return 'Falha de conexão. Verifique sua internet e tente novamente.';
}
