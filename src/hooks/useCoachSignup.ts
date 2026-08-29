import { useCallback, useRef, useState } from 'react';
import { CoachSignupError, CoachSignupService } from '../services/CoachSignupService';
import type { CoachSignupInput, CoachSignupResult, FoundingInviteLookup } from '../types/CoachSignup';

/**
 * `fechado`: o backend respondeu 404 sem token de convite — o auto-cadastro público está desligado
 * e a página deve oferecer a lista de espera, não um erro genérico.
 */
export type CoachSignupStatus = 'idle' | 'submitting' | 'success' | 'error' | 'fechado';

export type ConviteStatus = 'ocioso' | 'carregando' | 'valido' | 'invalido';

export interface ConviteState {
  status: ConviteStatus;
  dados: FoundingInviteLookup | null;
}

/**
 * Gerencia o envio do auto-cadastro, expondo estado, erro e o resultado — e, no modo convite, a
 * consulta do token.
 *
 * A chave de idempotência vive num ref e **sobrevive ao retry**: se o envio falhar por rede ou
 * `502`, a nova tentativa reusa a mesma chave, e o backend devolve o resultado da primeira em vez
 * de provisionar uma segunda assessoria. Gerar uma chave nova por requisição derrotaria o
 * mecanismo inteiro — seria o mesmo que não ter chave. (No modo convite o backend ignora o header
 * e deriva a chave do token; mandar a mesma continua correto.)
 *
 * A chave só é descartada quando o usuário altera o formulário (ver `reiniciarTentativa`), porque
 * aí a intenção mudou e reenviar a antiga devolveria `409`.
 */
export function useCoachSignup() {
  const [status, setStatus] = useState<CoachSignupStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CoachSignupResult | null>(null);
  const [convite, setConvite] = useState<ConviteState>({ status: 'ocioso', dados: null });
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
      if (e instanceof CoachSignupError && e.status === 404 && !input.inviteToken) {
        setStatus('fechado');
        return;
      }
      setStatus('error');
      setError(mensagemErro(e, Boolean(input.inviteToken)));
    }
  }, []);

  /** Chamar quando o usuário editar o formulário após um erro: a intenção deixou de ser a mesma. */
  const reiniciarTentativa = useCallback(() => {
    chaveDeIdempotencia.current = null;
  }, []);

  /** Consulta o convite do link. 404 em qualquer forma vira `invalido` — o motivo não é público. */
  const consultarConvite = useCallback(async (token: string) => {
    setConvite({ status: 'carregando', dados: null });
    try {
      const dados = await CoachSignupService.consultarConvite(token);
      setConvite({ status: 'valido', dados });
    } catch {
      setConvite({ status: 'invalido', dados: null });
    }
  }, []);

  return { status, error, resultado, convite, cadastrar, reiniciarTentativa, consultarConvite };
}

function mensagemErro(e: unknown, porConvite: boolean): string {
  if (e instanceof CoachSignupError) {
    if (e.status === 400) {
      return 'Verifique os dados informados e tente novamente.';
    }
    if (e.status === 404 && porConvite) {
      return 'Este convite não é mais válido. Peça um novo convite para entrar.';
    }
    if (e.status === 409) {
      return porConvite
        ? 'Este identificador já está em uso, ou seu cadastro já está em andamento. Tente outro identificador ou aguarde alguns instantes.'
        : 'Este identificador ou e-mail já está em uso. Tente outro.';
    }
    if (e.status === 422) {
      return 'O e-mail precisa ser o mesmo que recebeu o convite.';
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
