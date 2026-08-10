import { useCallback, useRef, useState } from 'react';
import { CoachSignupError, CoachSignupService } from '../services/CoachSignupService';
import type { CoachSignupInput, CoachSignupResult } from '../types/CoachSignup';

export type CoachSignupStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Gerencia o envio do auto-cadastro, expondo estado, erro e o resultado.
 *
 * A chave de idempotência vive num ref e **sobrevive ao retry**: se o envio falhar por rede ou
 * `502`, a nova tentativa reusa a mesma chave, e o backend devolve o resultado da primeira em vez
 * de provisionar uma segunda assessoria. Gerar uma chave nova por requisição derrotaria o
 * mecanismo inteiro — seria o mesmo que não ter chave.
 *
 * A chave só é descartada quando o usuário altera o formulário (ver `reiniciarTentativa`), porque
 * aí a intenção mudou e reenviar a antiga devolveria `409`.
 */
export function useCoachSignup() {
  const [status, setStatus] = useState<CoachSignupStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CoachSignupResult | null>(null);
  const chaveDeIdempotencia = useRef<string | null>(null);

  const cadastrar = useCallback(async (input: CoachSignupInput) => {
    chaveDeIdempotencia.current ??= crypto.randomUUID();
    setStatus('submitting');
    setError(null);
    try {
      const saida = await CoachSignupService.cadastrar(input, chaveDeIdempotencia.current);
      setResultado(saida);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError(mensagemErro(e));
    }
  }, []);

  /** Chamar quando o usuário editar o formulário após um erro: a intenção deixou de ser a mesma. */
  const reiniciarTentativa = useCallback(() => {
    chaveDeIdempotencia.current = null;
  }, []);

  return { status, error, resultado, cadastrar, reiniciarTentativa };
}

function mensagemErro(e: unknown): string {
  if (e instanceof CoachSignupError) {
    if (e.status === 400) {
      return 'Verifique os dados informados e tente novamente.';
    }
    if (e.status === 409) {
      return 'Este identificador ou e-mail já está em uso. Tente outro.';
    }
    if (e.status === 429) {
      return 'Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.';
    }
    if (e.status === 502 || e.status === 503) {
      return 'Não conseguimos concluir o cadastro agora. Tente novamente em alguns instantes.';
    }
    return 'Não foi possível concluir agora. Tente novamente em instantes.';
  }
  // fetch rejeita (sem resposta) em falha de rede
  return 'Falha de conexão. Verifique sua internet e tente novamente.';
}
