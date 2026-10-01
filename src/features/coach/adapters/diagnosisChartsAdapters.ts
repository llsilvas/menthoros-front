import { addDays, differenceInCalendarDays, format, parseISO, startOfDay, startOfWeek, subDays } from 'date-fns';
import { formatKmPt, plural } from './format';
import type { Aderencia4SemanasDto, AderenciasSemanalDto, DistanceSummaryDto, PmcPontoRaw } from '../../../types/AtletaPerfilCoach';
import type { MetricTone } from '../types/AthleteForm';
import type { AcwrConfidence, AdherenceWindow, DataGap, WeeklyDiagnosisPoint } from '../types/CoachInbox';

/** Dias seguidos sem TSS a partir dos quais a série é lacuna de registro, não descanso. */
export const GAP_MIN_DAYS = 10;
/** Base mínima para ler o ACWR (janela crônica clássica). */
export const ACWR_BASE_DAYS = 28;
/**
 * Semanas exibidas no gráfico "Adesão e carga por semana". É a cobertura que o perfil já traz em
 * `aderenciaSemanal` (8 semanas no backend): mostrar mais transformaria "não consultado" em "sem plano".
 */
export const DIAGNOSIS_WEEKS = 8;

const WEEK = { weekStartsOn: 1 } as const;
const toIso = (d: Date): string => format(d, 'yyyy-MM-dd');
const toLabel = (d: Date): string => format(d, 'dd/MM');

function activeDays(pmc: PmcPontoRaw[]): Date[] {
  return pmc
    .filter((p) => (p.tss ?? 0) > 0)
    .map((p) => parseISO(p.data))
    .sort((a, b) => a.getTime() - b.getTime());
}

function firstDay(pmc: PmcPontoRaw[]): Date | null {
  if (pmc.length === 0) return null;
  return pmc.map((p) => parseISO(p.data)).reduce((min, d) => (d < min ? d : min));
}

/**
 * `hoje` chega com hora; as datas da série são dias civis locais (`parseISO` de `yyyy-MM-dd`). Sem
 * normalizar, a comparação com o fim de uma lacuna aberta muda conforme o horário do acesso.
 */
const diaCivil = (d: Date): Date => startOfDay(d);

/** O backend devolve lista vazia e registra o campo em `avisos` quando a consulta falha. */
export function isFieldAvailable(avisos: string[] | null | undefined, campo: string): boolean {
  return !avisos?.includes(campo);
}

/**
 * Lacunas de registro: ≥ `minDays` dias sem TSS > 0 entre dois treinos, ou do último treino até
 * hoje (`open`). Dias antes do primeiro treino são início de histórico, não lacuna. Aceita série
 * densa (dias com tss=0) e esparsa (dias omitidos).
 */
export function detectDataGaps(pmc: PmcPontoRaw[], agora: Date, minDays = GAP_MIN_DAYS): DataGap[] {
  const hoje = diaCivil(agora);
  const ativos = activeDays(pmc);
  if (ativos.length === 0) return [];

  const gaps: DataGap[] = [];
  for (let i = 1; i < ativos.length; i += 1) {
    const dias = differenceInCalendarDays(ativos[i], ativos[i - 1]) - 1;
    if (dias >= minDays) {
      gaps.push({ start: toIso(addDays(ativos[i - 1], 1)), end: toIso(subDays(ativos[i], 1)), days: dias, open: false, kind: 'SEM_REGISTRO' });
    }
  }

  const ultimo = ativos[ativos.length - 1];
  const diasAberto = differenceInCalendarDays(hoje, ultimo);
  if (diasAberto >= minDays) {
    gaps.push({ start: toIso(addDays(ultimo, 1)), end: toIso(hoje), days: diasAberto, open: true, kind: 'SEM_REGISTRO' });
  }
  return gaps;
}

/**
 * Reclassifica lacunas de TSS em que houve treino: semana com `totalRealizado > 0` ou km > 0
 * dentro da lacuna → `SEM_TSS`. Sem isso, a legenda diz "sem treinos" ao lado de barras de 75%.
 *
 * Só conta semana INTEIRA dentro da lacuna (o mesmo critério de `noData` em `buildWeeklyDiagnosis`):
 * a semana que toca a borda pode conter justamente o último treino antes da pausa, e o dado é
 * semanal — não dá para saber em que dia ele caiu.
 */
export function classifyGaps(
  gaps: DataGap[],
  aderencia: AderenciasSemanalDto[],
  distance: DistanceSummaryDto | null,
): DataGap[] {
  const semanasComTreino = [
    ...aderencia.filter((a) => a.totalRealizado > 0).map((a) => startOfWeek(parseISO(a.semanaInicio), WEEK)),
    ...(distance?.weekly ?? []).filter((w) => w.distanceKm > 0).map((w) => startOfWeek(parseISO(w.weekStart), WEEK)),
  ];
  return gaps.map((g) => {
    const inicio = parseISO(g.start);
    const fim = parseISO(g.end);
    const houveTreino = semanasComTreino.some((s) => s >= inicio && addDays(s, 6) <= fim);
    return houveTreino ? { ...g, kind: 'SEM_TSS' as const } : g;
  });
}

/**
 * Semanas (seg–dom) das últimas `weeks` semanas, da mais antiga para a atual, com carga (Σ TSS)
 * e adesão da mesma semana. Uma semana inteira dentro de uma lacuna não tem carga (`noData`).
 * `activeDays` conta dias com TSS > 0, não treinos: o ponto PMC já é o agregado do dia.
 */
export function buildWeeklyDiagnosis(
  pmc: PmcPontoRaw[],
  aderencia: AderenciasSemanalDto[],
  gaps: DataGap[],
  agora: Date,
  weeks = DIAGNOSIS_WEEKS,
  distance: DistanceSummaryDto | null = null,
): WeeklyDiagnosisPoint[] {
  const hoje = diaCivil(agora);
  const inicioHistorico = firstDay(pmc);
  if (inicioHistorico == null && aderencia.length === 0 && distance == null) return [];
  const kmPorSemana = new Map((distance?.weekly ?? []).map((w) => [toIso(startOfWeek(parseISO(w.weekStart), WEEK)), w.distanceKm]));

  const cargaPorSemana = new Map<string, { tss: number; activeDays: number }>();
  for (const p of pmc) {
    const chave = toIso(startOfWeek(parseISO(p.data), WEEK));
    const acc = cargaPorSemana.get(chave) ?? { tss: 0, activeDays: 0 };
    const tss = Math.max(0, p.tss ?? 0);
    acc.tss += tss;
    if (tss > 0) acc.activeDays += 1;
    cargaPorSemana.set(chave, acc);
  }
  const aderenciaPorSemana = new Map(aderencia.map((a) => [toIso(startOfWeek(parseISO(a.semanaInicio), WEEK)), a]));
  const lacunas = gaps.map((g) => ({ start: parseISO(g.start), end: parseISO(g.end) }));
  const semanaAtual = startOfWeek(hoje, WEEK);

  return Array.from({ length: weeks }, (_, i) => {
    const inicio = subDays(semanaAtual, 7 * (weeks - 1 - i));
    const fim = addDays(inicio, 6);
    const fimEfetivo = fim > hoje ? hoje : fim;
    const chave = toIso(inicio);

    const plano = aderenciaPorSemana.get(chave);
    const km = kmPorSemana.get(chave) ?? null;
    const houveTreino = (plano?.totalRealizado ?? 0) > 0 || (km ?? 0) > 0;
    const naLacuna = lacunas.some((g) => g.start <= inicio && g.end >= fimEfetivo);
    // Treino sem TSS não é "sem registro": a semana mostra adesão e km, só não tem carga.
    const noData = naLacuna && !houveTreino;
    const antesDoHistorico = inicioHistorico == null || fim < inicioHistorico;
    const carga = cargaPorSemana.get(chave);
    const semCarga = naLacuna || antesDoHistorico;

    return {
      weekStart: chave,
      label: toLabel(inicio),
      tss: semCarga ? null : Math.round(carga?.tss ?? 0),
      activeDays: semCarga ? null : carga?.activeDays ?? 0,
      planned: plano?.totalPlanejado ?? null,
      completed: plano?.totalRealizado ?? null,
      adherence: plano ? Math.round(plano.percentual) : null,
      noData,
      current: i === weeks - 1,
      distanceKm: noData ? null : km,
    };
  });
}

/**
 * Mapeia `aderencia4Semanas` do perfil (semana atual + 3 anteriores, só treinos devidos — mesma
 * função do backend que alimenta `roster.aderenciaPercentual`, fix-adherence-count-until-today D5)
 * para o formato que o tile e as barras consomem. `null` sem nada devido na janela — nunca 0%.
 */
export function buildAdherenceWindowFromAderencia4Semanas(aderencia4Semanas: Aderencia4SemanasDto | null | undefined): AdherenceWindow | null {
  if (!aderencia4Semanas) return null;
  return {
    percent: Math.round(aderencia4Semanas.percentual),
    completed: aderencia4Semanas.realizado,
    planned: aderencia4Semanas.planejado,
    weeks: 4,
  };
}

/** Variação % de TSS: últimos 7 dias vs. 7 anteriores, por data. `null` sem base anterior. */
export function calculateLoadDelta7d(pmc: PmcPontoRaw[], agora: Date): number | null {
  const hoje = diaCivil(agora);
  let atual = 0;
  let anterior = 0;
  for (const p of pmc) {
    const d = differenceInCalendarDays(hoje, parseISO(p.data));
    const tss = Math.max(0, p.tss ?? 0);
    if (d >= 0 && d < 7) atual += tss;
    else if (d >= 7 && d < 14) anterior += tss;
  }
  if (anterior <= 0) return null;
  return parseFloat((((atual - anterior) / anterior) * 100).toFixed(1));
}

/**
 * O ACWR (ATL/CTL) só se sustenta com base crônica. Com histórico curto ou lacuna recente, CTL
 * está artificialmente baixo e qualquer retorno vira "Risco".
 *
 * O histórico começa no primeiro dia com TSS > 0, não no primeiro ponto: numa série densa, uma pausa
 * maior que o recorte consultado chega como zeros no início, e contá-los como base daria `ALTA` a um
 * retorno de três dias.
 */
export function assessAcwrConfidence(pmc: PmcPontoRaw[], gaps: DataGap[], agora: Date): AcwrConfidence {
  const hoje = diaCivil(agora);
  const inicio = activeDays(pmc)[0] ?? null;
  if (inicio == null) return { level: 'BAIXA', reason: 'Sem histórico de treinos' };
  if (differenceInCalendarDays(hoje, inicio) < ACWR_BASE_DAYS) {
    return { level: 'BAIXA', reason: `Histórico com menos de ${ACWR_BASE_DAYS} dias` };
  }
  const inicioBase = subDays(hoje, ACWR_BASE_DAYS - 1);
  const recente = gaps.find((g) => parseISO(g.end) >= inicioBase);
  if (recente) {
    const motivo = recente.kind === 'SEM_TSS' ? 'sem carga (TSS) registrada' : 'sem treinos registrados';
    return { level: 'BAIXA', reason: `Base crônica incompleta: ${recente.days} dias ${motivo}` };
  }
  return { level: 'ALTA', reason: null };
}

/** Tom da aderência — o mesmo para o tile e para as barras. */
export function adherenceTone(percent: number): MetricTone {
  if (percent >= 90) return 'success';
  if (percent >= 70) return 'neutral';
  if (percent >= 40) return 'warning';
  return 'danger';
}

export function formatGapCaption(gap: DataGap): string {
  const inicio = toLabel(parseISO(gap.start));
  const oque = gap.kind === 'SEM_TSS' ? 'Treinos sem carga (TSS) registrada' : 'Sem treinos registrados';
  if (gap.open) return `${oque} desde ${inicio} (${gap.days} dias)`;
  return `${oque} de ${inicio} a ${toLabel(parseISO(gap.end))} (${gap.days} dias)`;
}

/** Disponibilidade das consultas do perfil — falha de consulta não é ausência de dado. */
export interface DiagnosisAvailability {
  /** `false` quando a consulta de aderência falhou: ausência de entrada não significa "sem plano". */
  adherenceAvailable: boolean;
  /** `false` quando a consulta de PMC falhou: ausência de carga não significa zero. */
  pmcAvailable: boolean;
}

export const INDISPONIVEL_ADESAO = 'Adesão: dado indisponível';
export const INDISPONIVEL_CARGA = 'Carga: dado indisponível';

/** Texto do tooltip de uma semana. */
export function describeWeek(
  week: WeeklyDiagnosisPoint,
  { adherenceAvailable, pmcAvailable }: DiagnosisAvailability,
): { title: string; adherence: string; load: string } {
  const adherence = !adherenceAvailable
    ? INDISPONIVEL_ADESAO
    : week.adherence != null
      ? `Adesão ${week.adherence}% (${week.completed} de ${week.planned})${week.current ? ' · semana em curso' : ''}`
      : week.current
        ? 'Nada vencido ainda nesta semana'
        : 'Sem plano na semana';
  // Conta dias, não treinos: o ponto PMC já é o agregado do dia.
  const km = week.distanceKm != null ? `${formatKmPt(week.distanceKm)} km` : null;
  const tss =
    pmcAvailable && week.tss != null
      ? `${week.tss} TSS · ${plural(week.activeDays ?? 0, 'dia com treino', 'dias com treino')}`
      : null;
  const load = week.noData
    ? 'Sem treinos registrados'
    : km || tss
      ? `Carga ${[km, tss].filter(Boolean).join(' · ')}`
      : !pmcAvailable
        ? INDISPONIVEL_CARGA
        : 'Antes do histórico';
  return { title: `Semana de ${week.label}${week.current ? ' (atual)' : ''}`, adherence, load };
}

export interface AdherenceTile {
  value: string;
  delta: string;
  tone: MetricTone;
}

/**
 * Tile "Aderência". Disponibilidade própria, separada do PMC: aderência válida não some com PMC
 * vazio. O roster só entra quando o perfil ainda não carregou — com perfil, o número sai da mesma
 * janela que as barras exibem.
 */
export function buildAdherenceTile(
  window: AdherenceWindow | null,
  adherenceAvailable: boolean,
  rosterFallback: number | null | undefined,
): AdherenceTile {
  if (!adherenceAvailable) return { value: '—', delta: 'Dado indisponível', tone: 'neutral' };
  if (window) {
    return {
      value: `${window.percent}%`,
      delta: `${window.completed} de ${window.planned} treinos planejados`,
      tone: adherenceTone(window.percent),
    };
  }
  if (rosterFallback != null) {
    return { value: `${Math.round(rosterFallback)}%`, delta: 'Últimas 4 semanas', tone: adherenceTone(rosterFallback) };
  }
  return { value: '—', delta: 'Sem treino vencido na janela', tone: 'neutral' };
}
