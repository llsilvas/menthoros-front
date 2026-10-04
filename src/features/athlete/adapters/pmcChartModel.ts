import { addDays, differenceInCalendarDays, format, startOfDay, subDays } from 'date-fns';
import type { FaixaTsbStatus } from '../../../types/FaixaTsb';

export type PMCRange = '4w' | '8w' | '12w' | '6m' | '1y';

/**
 * Todas as telas recebem a série padrão do backend (90 dias) e nenhuma refaz a consulta ao trocar o
 * período; oferecer 6m/1a mostraria meses sem dado como se o atleta não tivesse treinado. Uma tela
 * que buscar por período passa `ranges` explicitamente.
 */
export const DEFAULT_RANGES: PMCRange[] = ['4w', '8w', '12w'];

export interface PMCDataPoint {
  date: Date;
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
  /** Faixa resolvida pelo backend para o dia; ausente quando sem TSB. */
  statusForma?: FaixaTsbStatus;
}

/** Período sem treinos registrados (inclusivo nas duas pontas). */
export interface PMCGap {
  start: Date;
  end: Date;
}

export type PmcSeriesKey = 'ctl' | 'atl' | 'tsb';

export interface PmcChartRow {
  /** Timestamp do dia — chave do eixo X (categórico, 1 linha por dia). */
  t: number;
  /** Dia sem ponto na série do backend. */
  missing: boolean;
  inGap: boolean;
  statusForma?: FaixaTsbStatus;
  tss: number | null;
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
  /** Fora de lacuna — linha contínua. */
  ctlSolid: number | null;
  atlSolid: number | null;
  tsbSolid: number | null;
  /** Dentro de lacuna + vizinhos — linha tracejada (valor estimado por decaimento). */
  ctlEst: number | null;
  atlEst: number | null;
  tsbEst: number | null;
  /**
   * Ponto contínuo sem vizinho com valor (série esparsa): a linha não tem com quem se ligar e
   * sumiria. O gráfico desenha um ponto nele — sem ligar os dias que o backend não mandou.
   */
  isolated: boolean;
}

export interface PmcGapArea {
  x1: number;
  x2: number;
  /** `declared`: `PMCGap` do caller (sem treino, mas o backend tem CTL/ATL/TSB do dia — linha tracejada
   * cobre o trecho). `missing`: o backend não mandou nada para o dia — sem valor pra tracejar, só a
   * área hachurada avisa que o buraco é esperado, não quebra de gráfico. */
  kind: 'declared' | 'missing';
}

export interface PmcChartModel {
  rows: PmcChartRow[];
  ticks: number[];
  gapAreas: PmcGapArea[];
  /** Último dia com valores — alimenta a legenda com o valor atual. */
  latest: PmcChartRow | null;
  /** Algum dia do período tem valor. Falso: o período escolhido cai todo antes da série. */
  hasValues: boolean;
}

export const RANGE_DAYS: Record<PMCRange, number> = {
  '4w': 28,
  '8w': 56,
  '12w': 84,
  '6m': 182,
  '1y': 365,
};

const EMPTY: PmcChartModel = { rows: [], ticks: [], gapAreas: [], latest: null, hasValues: false };
const key = (d: Date) => format(d, 'yyyy-MM-dd');
const SERIES: PmcSeriesKey[] = ['ctl', 'atl', 'tsb'];

/**
 * Prepara a série para o gráfico:
 * - filtra pelo período (últimos N dias terminando em hoje) — antes o seletor não filtrava;
 * - densifica por dia, para o eixo categórico ser proporcional ao tempo;
 * - separa cada série em trecho contínuo e trecho estimado (lacunas);
 * - gera ticks semanais contados de hoje.
 *
 * O eixo termina em hoje, não no último ponto: com série esparsa, o backend não manda nada depois do
 * último treino, e terminar ali esconderia justamente a inatividade recente. Os dias sem ponto ficam
 * `missing` com valores `null` — o front não inventa decaimento.
 */
export function buildPmcChartModel(
  data: PMCDataPoint[],
  gaps: PMCGap[],
  range: PMCRange,
  agora: Date = new Date(),
): PmcChartModel {
  if (data.length === 0) return EMPTY;

  const porDia = new Map(data.map((p) => [key(p.date), p]));
  const ultimoPonto = data.reduce((m, p) => (p.date > m ? p.date : m), data[0].date);
  const hoje = startOfDay(agora);
  const ultimo = ultimoPonto > hoje ? startOfDay(ultimoPonto) : hoje;
  const primeiro = data.reduce((m, p) => (p.date < m ? p.date : m), data[0].date);
  const inicioPeriodo = subDays(ultimo, RANGE_DAYS[range] - 1);
  const inicio = primeiro > inicioPeriodo ? startOfDay(primeiro) : inicioPeriodo;
  const total = differenceInCalendarDays(ultimo, inicio) + 1;
  const dias = Array.from({ length: total }, (_, i) => addDays(inicio, i));

  const naLacuna = (dia: Date) =>
    gaps.some((g) => differenceInCalendarDays(dia, g.start) >= 0 && differenceInCalendarDays(g.end, dia) >= 0);
  const flags = dias.map(naLacuna);

  const rows: PmcChartRow[] = dias.map((dia, i) => {
    const p = porDia.get(key(dia));
    const perto = flags[i] || flags[i - 1] === true || flags[i + 1] === true;
    const row: PmcChartRow = {
      t: dia.getTime(),
      missing: !p,
      inGap: flags[i],
      statusForma: p?.statusForma,
      tss: p ? p.tss : null,
      ctl: null, atl: null, tsb: null,
      ctlSolid: null, atlSolid: null, tsbSolid: null,
      ctlEst: null, atlEst: null, tsbEst: null,
      isolated: false,
    };
    if (p) {
      for (const s of SERIES) {
        row[s] = p[s];
        row[`${s}Solid` as const] = flags[i] ? null : p[s];
        row[`${s}Est` as const] = perto ? p[s] : null;
      }
    }
    return row;
  });

  const temSolido = (r: PmcChartRow | undefined) =>
    r != null && (r.ctlSolid != null || r.atlSolid != null || r.tsbSolid != null);
  rows.forEach((r, i) => {
    r.isolated = temSolido(r) && !temSolido(rows[i - 1]) && !temSolido(rows[i + 1]);
  });

  /**
   * Áreas hachuradas do gráfico: lacunas declaradas (`r.inGap`, vindas do `gaps` do caller) e
   * trechos `missing` que o caller não declarou. Sem isso, um dia sem ponto no meio da série (ex.:
   * backfill incompleto) desenha uma linha simplesmente cortada, sem nada — parece gráfico quebrado
   * em vez de buraco de dado conhecido. `missing` só gera área própria fora de uma lacuna já
   * declarada — uma lacuna aberta sem retorno do backend (ex.: série parou há semanas) é `inGap` E
   * `missing` ao mesmo tempo, e já tem área (e aviso) próprios; duplicar a hachura ali não ajuda.
   */
  const coletarAreas = (achatado: (r: PmcChartRow) => boolean, kind: PmcGapArea['kind']): PmcGapArea[] => {
    const areas: PmcGapArea[] = [];
    let inicioRun = -1;
    rows.forEach((r, i) => {
      if (achatado(r) && inicioRun < 0) inicioRun = i;
      const fecha = inicioRun >= 0 && (!achatado(r) || i === rows.length - 1);
      if (fecha) {
        areas.push({ x1: rows[inicioRun].t, x2: rows[achatado(r) ? i : i - 1].t, kind });
        inicioRun = -1;
      }
    });
    return areas;
  };
  const gapAreas: PmcGapArea[] = [
    ...coletarAreas((r) => r.inGap, 'declared'),
    ...coletarAreas((r) => r.missing && !r.inGap, 'missing'),
  ].sort((a, b) => a.x1 - b.x1);

  const passo = range === '6m' || range === '1y' ? 28 : 7;
  const ticks: number[] = [];
  for (let i = rows.length - 1; i >= 0; i -= passo) ticks.push(rows[i].t);
  ticks.reverse();

  const latest = [...rows].reverse().find((r) => r.ctl != null) ?? null;
  const hasValues = rows.some((r) => r.ctl != null || r.tss != null);
  return { rows, ticks, gapAreas, latest, hasValues };
}
