import { getMonotonyTone, getStrainZone, MONOTONIA_MIN_DIAS } from './coachInboxAdapters';
import { decimal, signed } from './athleteKpiAdapters';
import { formVariantLabel, getTsbFormaTone } from '../types/AthleteForm';
import type { KpiView } from './athleteKpiAdapters';
import type { CoachAthleteRow } from '../types/CoachInbox';

export type DiagnosisMetricKey = 'acuteLoad' | 'monotony' | 'strain' | 'racePrediction';

export interface DiagnosisMetric extends KpiView {
  key: DiagnosisMetricKey;
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function semBase(diasComTreino: number): string {
  return `Sem base: ${plural(diasComTreino, 'dia', 'dias')} com treino (mínimo ${MONOTONIA_MIN_DIAS})`;
}

function acuteLoadMetric(row: CoachAthleteRow): DiagnosisMetric {
  const base = { key: 'acuteLoad' as const, label: 'Carga aguda', qualifier: 'ATL', badge: null };
  const atl = row.quickStats.acuteLoad;
  if (atl == null) return { ...base, value: '—', detail: 'Sem dado na janela', tone: 'neutral' };
  // Sem tom: não há limiar de ATL por atleta, e o limiar antigo (120) era de km.
  return { ...base, value: `${decimal(atl, 1)} TSS/dia`, detail: 'Média do TSS diário com peso nos últimos ~7 dias', tone: 'neutral' };
}

function monotonyMetric(row: CoachAthleteRow): DiagnosisMetric {
  const base = { key: 'monotony' as const, label: 'Monotonia', qualifier: '7 dias', badge: null };
  const { monotony, trainingDays7d } = row.quickStats;
  if (monotony == null) return { ...base, value: '—', detail: semBase(trainingDays7d), tone: 'neutral' };
  return {
    ...base,
    value: decimal(monotony, 2),
    detail: `${plural(trainingDays7d, 'dia', 'dias')} com treino · alta = semana pouco variada`,
    tone: getMonotonyTone(monotony),
  };
}

function strainMetric(row: CoachAthleteRow): DiagnosisMetric {
  const base = { key: 'strain' as const, label: 'Strain', qualifier: '7 dias', badge: null };
  const { strain, trainingDays7d } = row.quickStats;
  if (strain == null) return { ...base, value: '—', detail: semBase(trainingDays7d), tone: 'neutral' };
  const zona = getStrainZone(strain);
  return { ...base, value: decimal(strain, 0), detail: `${zona.label} · TSS da semana × monotonia`, tone: zona.tone };
}

function racePredictionMetric(row: CoachAthleteRow): DiagnosisMetric {
  const base = { key: 'racePrediction' as const, label: 'Forma prevista', qualifier: 'na prova', badge: null };
  const previsao = row.racePrediction;
  if (!previsao) {
    // `racePrediction` é null sem prova futura ou sem CTL/ATL; como a seção só aparece com série na
    // janela, sobra o caso sem prova futura.
    return { ...base, value: '—', detail: 'Sem prova futura cadastrada', tone: 'neutral' };
  }
  return {
    ...base,
    value: formVariantLabel[previsao.formaPrevista],
    detail: `TSB ${signed(previsao.tsbPrevisto, 1)} em ${plural(previsao.diasAteProva, 'dia', 'dias')}, sem carga até a prova`,
    tone: getTsbFormaTone(previsao.formaPrevista),
  };
}

/** Métricas da aba Diagnóstico, no mesmo formato de célula da faixa de KPIs do atleta. */
export function buildDiagnosisMetrics(row: CoachAthleteRow): DiagnosisMetric[] {
  return [acuteLoadMetric(row), monotonyMetric(row), strainMetric(row), racePredictionMetric(row)];
}
