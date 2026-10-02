import { differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { extractDistanciaKey, extractStatusKey, extractTipoKey } from '../../../types/Prova';
import type { DistanciaProva, Prova, TipoProva } from '../../../types/Prova';
import { rotuloDistancia, semanasFaltando } from '../../../utils/racePreparation';

export type Terreno = 'RUA' | 'TRAIL';

export const TERRENO_LABELS: Record<Terreno, string> = { RUA: 'Rua', TRAIL: 'Trail' };

/** `dataIso >= hoje`. Único critério de "é futura" do arquivo — achado do clean-code-reviewer,
 * 2026-10-01: a comparação lexicográfica de `yyyy-MM-dd` estava duplicada em 3 funções. */
function isFutura(dataIso: string, hoje: Date): boolean {
  return dataIso >= format(hoje, 'yyyy-MM-dd');
}

/**
 * Categoria visual do card na lista "Minhas provas" (reorganizar-listagem-provas-atleta).
 * - `alvo`: prova-alvo futura — destaque maior, sem depender de ser a mais próxima.
 * - `proxima`: a prova futura mais próxima por data, SÓ quando essa prova não é a alvo (CA4: se a
 *   alvo for a mais próxima, nenhuma outra prova herda a categoria `proxima`).
 * - `futura`: demais provas futuras, sem destaque.
 * - `historico`: provas passadas (por data, não pelo campo `realizada` — uma prova passada e nunca
 *   registrada como realizada ainda é histórico, não deve poluir a seção de futuras).
 */
export type RaceCategory = 'alvo' | 'proxima' | 'futura' | 'historico';

/** View model de uma prova nas telas do atleta (lista, faixa do Plano). */
export interface AthleteRaceView {
  id: string;
  nome: string;
  dataIso: string;
  /** "6 de dez de 2026" */
  dataLabel: string;
  distancia: DistanciaProva;
  distanciaKm?: number;
  distanciaLabel: string;
  tipoProva: TipoProva;
  terreno: Terreno;
  alvo: boolean;
  realizada: boolean;
  tempoObjetivo?: string;
  semanasFaltando: number;
  /** Mínimo da tabela, derivado pelo backend; ausente em prova legada sem derivação. */
  semanasMinimas?: number;
  preparacaoCurta: boolean;
  /** Preenchida só por `buildAthleteRaceList` — depende da posição da prova na lista ordenada. */
  categoria?: RaceCategory;
}

export function terrenoDe(tipoProva: TipoProva): Terreno {
  return tipoProva === 'TRAIL' ? 'TRAIL' : 'RUA';
}

/** Regra do formulário (design D7): 21 → MEIA, 42 → MARATONA, senão pelo terreno. */
export function tipoProvaDerivado(distancia: DistanciaProva, terreno: Terreno): TipoProva {
  if (distancia === 'KM_21') return 'MEIA';
  if (distancia === 'KM_42') return 'MARATONA';
  return terreno === 'TRAIL' ? 'TRAIL' : 'CORRIDA_RUA';
}

export function buildAthleteRaceView(prova: Prova, hoje: Date = new Date()): AthleteRaceView {
  const distancia = extractDistanciaKey(prova.distancia) ?? 'KM_10';
  const tipoProva = extractTipoKey(prova.tipoProva) ?? 'CORRIDA_RUA';
  return {
    id: prova.id,
    nome: prova.nomeProva,
    dataIso: prova.dataProva,
    dataLabel: format(parseISO(prova.dataProva), "d 'de' MMM 'de' yyyy", { locale: ptBR }),
    distancia,
    distanciaKm: prova.distanciaKm,
    distanciaLabel: rotuloDistancia(distancia, prova.distanciaKm),
    tipoProva,
    terreno: terrenoDe(tipoProva),
    alvo: prova.provaAlvo === true,
    realizada: prova.foiRealizada === true || extractStatusKey(prova.statusProva) === 'CONCLUIDA',
    tempoObjetivo: prova.tempoObjetivo,
    semanasFaltando: prova.semanasFaltando ?? semanasFaltando(prova.dataProva, hoje),
    semanasMinimas: prova.semanasPreparacao,
    preparacaoCurta: prova.preparacaoCurta === true,
  };
}

/**
 * Lista para a tela "Minhas provas" (reorganizar-listagem-provas-atleta): ordem cronológica vence
 * sobre alvo — futuras ascendente (a mais próxima no topo), passadas depois, como histórico
 * (descendente — a mais recente primeiro). A prova-alvo não pula posição por ser alvo; ela aparece
 * onde cai no calendário, com a categoria `alvo` para o destaque visual (CA1, CA2).
 *
 * Uma prova marcada `realizada` sempre vai para o histórico, mesmo com `dataIso` ainda não passada
 * (ex.: resultado lançado antes da data oficial) — achado do Codex review, 2026-10-01: o código
 * anterior (`race.alvo && !race.realizada`) já excluía provas concluídas do destaque de alvo, e a
 * categorização só por data perdia essa guarda, deixando o banner "PROVA-ALVO" junto do chip
 * "Realizada" no mesmo card.
 */
export function buildAthleteRaceList(provas: Prova[], hoje: Date = new Date()): AthleteRaceView[] {
  const views = provas.map((p) => buildAthleteRaceView(p, hoje));

  const futuras = views
    .filter((v) => isFutura(v.dataIso, hoje) && !v.realizada)
    .sort((a, b) => a.dataIso.localeCompare(b.dataIso));
  const passadas = views
    .filter((v) => !isFutura(v.dataIso, hoje) || v.realizada)
    .sort((a, b) => b.dataIso.localeCompare(a.dataIso));

  // A categoria `proxima` é só da prova mais próxima por data (futuras[0]), e só quando ela não é
  // alvo — se a alvo for a mais próxima, nenhuma outra prova herda `proxima` (CA3, CA4, CA6).
  const maisProxima = futuras[0];
  const proximaNaoAlvoId = maisProxima && !maisProxima.alvo ? maisProxima.id : undefined;

  const futurasComCategoria = futuras.map((v): AthleteRaceView => ({
    ...v,
    categoria: v.alvo ? 'alvo' : v.id === proximaNaoAlvoId ? 'proxima' : 'futura',
  }));
  const passadasComCategoria = passadas.map((v): AthleteRaceView => ({ ...v, categoria: 'historico' }));

  return [...futurasComCategoria, ...passadasComCategoria];
}

/** Prova-alvo futura e não realizada; `null` quando não há. */
export function selectTargetRace(provas: Prova[], hoje: Date = new Date()): AthleteRaceView | null {
  const alvo = provas.find((p) => p.provaAlvo === true && p.foiRealizada !== true && isFutura(p.dataProva, hoje));
  return alvo ? buildAthleteRaceView(alvo, hoje) : null;
}

/** Provas futuras não realizadas (candidatas a alvo). */
export function countUpcomingRaces(provas: Prova[], hoje: Date = new Date()): number {
  return provas.filter((p) => p.foiRealizada !== true && isFutura(p.dataProva, hoje)).length;
}

/** Segunda-feira da semana que contém `d`, hora zerada. */
/** View model da faixa "Prova nesta semana" (prova-no-plano-semanal, design.md D7). */
export interface RaceThisWeekView {
  id: string;
  nome: string;
  dataIso: string;
  /** "domingo" — nome do dia da semana da prova. */
  diaSemanaLabel: string;
  /** Dias até a prova, nunca negativo (prova hoje = 0). */
  diasFaltando: number;
}

/**
 * Prova não cancelada nem realizada cuja data cai na semana corrente (segunda→domingo). Tem
 * prioridade sobre a prova-alvo na faixa do Plano — é o que está prestes a acontecer, alvo ou não.
 */
export function selectRaceThisWeek(provas: Prova[], hoje: Date = new Date()): RaceThisWeekView | null {
  const inicio = startOfWeek(hoje, { weekStartsOn: 1 });
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  const inicioIso = format(inicio, 'yyyy-MM-dd');
  const fimIso = format(fim, 'yyyy-MM-dd');

  const candidatas = provas
    .filter((p) => p.foiRealizada !== true
      && extractStatusKey(p.statusProva) !== 'CANCELADA'
      && p.dataProva >= inicioIso && p.dataProva <= fimIso)
    .sort((a, b) => a.dataProva.localeCompare(b.dataProva));

  const candidata = candidatas[0];
  if (!candidata) return null;

  const dataProva = parseISO(candidata.dataProva);
  return {
    id: candidata.id,
    nome: candidata.nomeProva,
    dataIso: candidata.dataProva,
    diaSemanaLabel: format(dataProva, 'EEEE', { locale: ptBR }),
    diasFaltando: Math.max(0, differenceInCalendarDays(dataProva, hoje)),
  };
}
