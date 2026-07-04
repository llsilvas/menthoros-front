import { format } from 'date-fns';
import type { Prova } from '../../../types/Prova';

export interface ProximaProva {
  nomeProva: string;
  /** Direto do DTO (já calculado pelo backend, D0.3) — `undefined` quando o campo não vier, nunca fabricado como 0. */
  diasFaltando?: number;
}

/**
 * Filtra a prova futura mais próxima (`dataProva >= hoje`, ordenada por data ascendente).
 * `diasFaltando` vem direto do DTO — não recalcula a diferença de dias no frontend, e não
 * fabrica um valor (`0`) quando o campo não vier populado (CA3). Retorna `null` quando não há
 * prova futura cadastrada (CA2 — CTA honesto).
 */
export function buildProximaProva(provas: Prova[], hoje: Date = new Date()): ProximaProva | null {
  const hojeIso = format(hoje, 'yyyy-MM-dd');

  const futuras = provas
    .filter((p) => p.dataProva >= hojeIso)
    .sort((a, b) => a.dataProva.localeCompare(b.dataProva));

  if (futuras.length === 0) {
    return null;
  }

  const proxima = futuras[0];
  return { nomeProva: proxima.nomeProva, diasFaltando: proxima.diasFaltando };
}
