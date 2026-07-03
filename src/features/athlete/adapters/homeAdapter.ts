import type { AthleteHome, AthleteMetricasChave } from '../../../types/AthleteHome';
import type { TimeOfDay } from '../../../shared/design-tokens/gradients';
import { mapTipoTreino, type WorkoutType } from '../../coach/adapters/workoutType';

export interface HomeMetric {
  label: string;
  value: string;
  unit: string;
  tooltip: string;
}

export interface HomeNextWorkout {
  title: string;
  description: string;
}

/** Período do dia a partir do relógio local do usuário (dado real, não fabricado). */
export function timeOfDayNow(hora: number = new Date().getHours()): TimeOfDay {
  if (hora >= 5 && hora < 12) return 'morning';
  if (hora >= 12 && hora < 18) return 'afternoon';
  if (hora >= 18 && hora < 22) return 'evening';
  return 'night';
}

/** WorkoutType da UI a partir do tipo do próximo treino (default seguro quando ausente). */
export function homeWorkoutType(home: AthleteHome | null): WorkoutType {
  return mapTipoTreino(home?.proximoTreino?.tipoTreino);
}

const TIPO_TREINO_LABEL: Readonly<Record<string, string>> = {
  REGENERATIVO: 'Regenerativo',
  FACIL: 'Corrida Fácil',
  CONTINUO: 'Corrida Fácil',
  LONGO: 'Longo',
  TEMPO_RUN: 'Tempo Run',
  PROVA: 'Prova',
  INTERVALADO: 'Intervalado',
  TIRO: 'Tiros',
  FARTLEK: 'Fartlek',
  SUBIDA: 'Subidas',
};

/** Rótulo PT-BR do tipo de treino para exibição (default seguro "Treino"). */
export function tipoTreinoLabel(tipoTreino?: string): string {
  if (!tipoTreino) return 'Treino';
  return TIPO_TREINO_LABEL[tipoTreino] ?? 'Treino';
}

/** Sub-card do próximo treino; `null` quando não há próximo treino planejado. */
export function buildNextWorkout(home: AthleteHome | null): HomeNextWorkout | null {
  const p = home?.proximoTreino;
  if (!p) return null;
  return {
    title: tipoTreinoLabel(p.tipoTreino),
    description: p.descricao ?? '',
  };
}

function fmt(value: number | undefined, digits = 0): string {
  return value == null ? '—' : value.toFixed(digits);
}

function fmtSigned(value: number | undefined): string {
  if (value == null) return '—';
  const r = Math.round(value);
  return r > 0 ? `+${r}` : `${r}`;
}

/** Métricas-chave do dia (grid da Home) a partir de `metricasChave` — nunca fabrica valor. */
export function buildHomeMetrics(m: AthleteMetricasChave | undefined): HomeMetric[] {
  return [
    { label: 'Carga de treino', value: m?.tss != null ? String(m.tss) : '—', unit: 'TSS',
      tooltip: 'Training Stress Score — quanto o treino custou para seu corpo.' },
    { label: 'Condicionamento', value: fmt(m?.ctl), unit: 'pts',
      tooltip: 'CTL (Chronic Training Load) — sua forma física dos últimos 42 dias.' },
    { label: 'Forma', value: fmtSigned(m?.tsb), unit: 'pts',
      tooltip: 'TSB — equilíbrio entre carga e recuperação. Positivo = fresco.' },
    { label: 'Cansaço', value: fmt(m?.atl), unit: 'pts',
      tooltip: 'ATL (Acute Training Load) — fadiga acumulada dos últimos 7 dias.' },
  ];
}
