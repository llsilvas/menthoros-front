import { buildAdherenceTile } from './diagnosisChartsAdapters';
import { decimal, formatKmPt, signed } from './format';
import { getAcwrZone } from './coachInboxAdapters';
import type { FaixaApresentacao } from '../../../types/FaixaTsb';
import type { KpiView } from '../types/Kpi';
import type { CoachAthleteRow, RaceItem } from '../types/CoachInbox';

export type AthleteKpiKey = 'adherence' | 'load' | 'form' | 'acwr';

export interface AthleteKpi extends KpiView {
  key: AthleteKpiKey;
}

export interface NextRaceHeader {
  label: 'Prova alvo' | 'Próxima prova';
  name: string;
  when: string;
  isTarget: boolean;
}

const SEM_DADO = 'Sem dado na janela';

function semDado(key: AthleteKpiKey, label: string, qualifier: string | null): AthleteKpi {
  return { key, label, qualifier, value: '—', detail: SEM_DADO, tone: 'neutral', badge: null };
}

function adherenceKpi(row: CoachAthleteRow, rosterFallback: number | null): AthleteKpi {
  const tile = buildAdherenceTile(row.adherenceWindow, row.adherenceAvailable, rosterFallback);
  return { key: 'adherence', label: 'Aderência', qualifier: '4 sem', value: tile.value, detail: tile.delta, tone: tile.tone, badge: null };
}

/** Com km do backend: valor e comparação na mesma unidade, como na Proposta. */
function loadKpiKm(km: { lastKm: number; previousKm: number }): AthleteKpi {
  const base = { key: 'load' as const, label: 'Carga', qualifier: '7 dias', value: `${formatKmPt(km.lastKm)} km`, badge: null };
  if (km.previousKm <= 0) {
    return { ...base, detail: 'Sem carga nos 7 dias anteriores para comparar', tone: 'neutral' };
  }
  const delta = ((km.lastKm - km.previousKm) / km.previousKm) * 100;
  return {
    ...base,
    detail: `${signed(Math.round(delta), 0)}% vs. 7 dias anteriores (${formatKmPt(km.previousKm)} km)`,
    tone: delta >= 10 ? 'warning' : 'success',
  };
}

function loadKpi(row: CoachAthleteRow): AthleteKpi {
  if (row.distance7d) return loadKpiKm(row.distance7d);
  const base = { key: 'load' as const, label: 'Carga', qualifier: '7 dias', value: `${formatKmPt(row.load7d)} km`, badge: null };
  if (row.loadDelta == null) {
    return { ...base, detail: 'Sem carga nos 7 dias anteriores para comparar', tone: 'neutral' };
  }
  // Delta em TSS: o perfil não traz km dos 7 dias anteriores (follow-up de backend).
  return {
    ...base,
    detail: `TSS ${signed(Math.round(row.loadDelta), 0)}% vs. 7 dias anteriores`,
    tone: row.loadDelta >= 10 ? 'warning' : 'success',
  };
}

function formKpi(row: CoachAthleteRow, faixa: FaixaApresentacao | null): AthleteKpi {
  const tsb = row.quickStats.tsb;
  return {
    key: 'form',
    label: 'Forma',
    qualifier: 'TSB',
    value: faixa?.label ?? '—',
    detail: tsb != null ? `TSB ${signed(tsb, 1)}` : 'TSB não disponível',
    tone: faixa?.tone ?? 'neutral',
    badge: null,
  };
}

function acwrKpi(row: CoachAthleteRow): AthleteKpi {
  const base = { key: 'acwr' as const, label: 'ACWR', qualifier: null };
  const acwr = row.quickStats.acwr;
  // ACWR pode faltar com série presente: calcularAcwr usa só o último ponto, que pode não ter ATL/CTL.
  if (acwr == null) return { ...base, value: '—', detail: 'Dado insuficiente', tone: 'neutral', badge: null };

  const confianca = row.quickStats.acwrConfidence;
  if (confianca?.level === 'BAIXA') {
    // Base crônica incompleta infla o ACWR; "Risco" aqui seria alarme falso.
    return {
      ...base,
      value: decimal(acwr, 2),
      detail: confianca.reason ?? 'Base crônica incompleta',
      tone: 'neutral',
      badge: 'Baixa confiança',
    };
  }
  const zona = getAcwrZone(acwr);
  return { ...base, value: decimal(acwr, 2), detail: `${zona.label} · carga aguda ÷ crônica`, tone: zona.tone, badge: null };
}

/**
 * Faixa de KPIs do atleta selecionado. "Sem dado na janela" (série PMC vazia) vence as regras de
 * Carga, Forma e ACWR — esses campos têm fallback numérico que não pode aparecer como medição. A
 * aderência não sai do PMC e tem disponibilidade própria.
 *
 * `rosterFallback`: aderência do roster, só enquanto o perfil não carregou; com perfil, `null`.
 */
export function buildAthleteKpis(row: CoachAthleteRow, faixa: FaixaApresentacao | null, rosterFallback: number | null): AthleteKpi[] {
  const adherence = adherenceKpi(row, rosterFallback);
  if (!row.quickStats.hasWindowData) {
    // Km vem do backend, não do PMC: com série vazia, a carga em km continua valendo.
    const load = row.distance7d ? loadKpiKm(row.distance7d) : semDado('load', 'Carga', '7 dias');
    return [adherence, load, semDado('form', 'Forma', 'TSB'), semDado('acwr', 'ACWR', null)];
  }
  return [adherence, loadKpi(row), formKpi(row, faixa), acwrKpi(row)];
}

/** Próxima prova no cabeçalho (saiu da faixa de KPIs). `daysUntil < 0` = sem contagem. */
export function buildNextRaceHeader(race: RaceItem | null, daysUntil: number): NextRaceHeader | null {
  if (!race) return null;
  const quando =
    daysUntil > 1 ? ` · em ${daysUntil} dias` : daysUntil === 1 ? ' · amanhã' : daysUntil === 0 ? ' · hoje' : '';
  const isTarget = race.tag === 'ALVO';
  return { label: isTarget ? 'Prova alvo' : 'Próxima prova', name: race.label, when: `${race.date}${quando}`, isTarget };
}
