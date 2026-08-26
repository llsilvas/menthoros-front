import { useCallback, useEffect, useRef, useState } from 'react';
import type { CheckinProntidaoInput, CheckinProntidaoOutput } from '../../../types/Checkin';
import {
  SELECAO_VAZIA, pendentes as contarPendentes, selecaoDeCheckin, selecaoParaInput,
  type CheckinItemKey, type NivelInline, type SelecaoInline,
} from '../adapters/inlineCheckinMapping';

const DEBOUNCE_MS = 600;

export interface UseInlineCheckinArgs {
  checkinHoje: CheckinProntidaoOutput | null;
  registrar: (input: CheckinProntidaoInput) => Promise<CheckinProntidaoOutput>;
  /** Chamado após cada POST com sucesso — a Home refetcha prontidão e check-in atual. */
  onSaved: () => Promise<void> | void;
}

/**
 * Check-in inline da Home (design D2). Primeiro check-in do dia: nada é enviado até os cinco itens
 * terem nível — os campos são `@NotNull` no backend e um default inventado viraria dado de
 * prontidão. Check-in existente: cada toque envia o DTO completo, com debounce.
 */
export function useInlineCheckin({ checkinHoje, registrar, onSaved }: UseInlineCheckinArgs) {
  const [selecao, setSelecao] = useState<SelecaoInline>(() => (checkinHoje ? selecaoDeCheckin(checkinHoje) : SELECAO_VAZIA));
  const [salvo, setSalvo] = useState<boolean>(checkinHoje !== null);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoSalvo = useRef<SelecaoInline>(selecao);

  // Check-in chegando depois da montagem (fetch assíncrono da Home): deriva a seleção uma vez.
  useEffect(() => {
    if (checkinHoje && contarPendentes(ultimoSalvo.current) > 0) {
      const derivada = selecaoDeCheckin(checkinHoje);
      ultimoSalvo.current = derivada;
      setSelecao(derivada);
      setSalvo(true);
    }
  }, [checkinHoje]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const enviar = useCallback(async (proxima: SelecaoInline) => {
    const input = selecaoParaInput(proxima);
    if (!input) return;
    const anterior = ultimoSalvo.current;
    setSalvando(true);
    setError(null);
    try {
      await registrar(input);
      ultimoSalvo.current = proxima;
      setSalvo(true);
      await onSaved();
    } catch (e) {
      setSelecao(anterior);
      setSalvo(contarPendentes(anterior) === 0);
      setError(e instanceof Error ? e : new Error('Não foi possível salvar o check-in'));
    } finally {
      setSalvando(false);
    }
  }, [registrar, onSaved]);

  const agendar = useCallback((proxima: SelecaoInline, imediato: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    if (imediato) { void enviar(proxima); return; }
    timer.current = setTimeout(() => { void enviar(proxima); }, DEBOUNCE_MS);
  }, [enviar]);

  const aplicar = useCallback((key: CheckinItemKey, nivel: NivelInline) => {
    setSelecao((atual) => {
      const proxima = { ...atual, [key]: nivel };
      const primeiroCheckin = contarPendentes(ultimoSalvo.current) > 0;
      if (contarPendentes(proxima) === 0) agendar(proxima, primeiroCheckin);
      return proxima;
    });
    setSalvo(false);
  }, [agendar]);

  /** Toque: cicla 1 → 2 → 3 → 1; item sem estado começa em 1. */
  const selecionar = useCallback((key: CheckinItemKey) => {
    const atual = selecao[key];
    const proximo = (atual === null ? 1 : atual === 3 ? 1 : atual + 1) as NivelInline;
    aplicar(key, proximo);
  }, [selecao, aplicar]);

  const definir = useCallback((key: CheckinItemKey, nivel: NivelInline) => {
    if (!(key in SELECAO_VAZIA)) return;
    aplicar(key, nivel);
  }, [aplicar]);

  return { selecao, pendentes: contarPendentes(selecao), salvo, salvando, error, selecionar, definir };
}
