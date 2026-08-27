import type { AthleteHome } from '../../../types/AthleteHome';
import type { TimeOfDay } from '../../../shared/design-tokens/gradients';
import { workoutTypeColor } from '../../../theme/activeTheme';
import { selectWorkoutProfile, fromEtapaTreino, type WorkoutProfileData } from '../../workout/profile';
import { indexarRepeticoes } from '../../workout/profile/input';


export interface HomeNextWorkout {
  title: string;
  description: string;
  /** Cor do tipo de treino — fonte única `workoutTypeColor()` (mesma fonte do Plano). */
  color: string;
  estimatedDuration?: number;
  /** Perfil do treino (mesmo caminho do `WorkoutDetailDrawer`); ausente sem etapas — sem placeholder. */
  profile?: WorkoutProfileData;
}

/** Período do dia a partir do relógio local do usuário (dado real, não fabricado). */
export function timeOfDayNow(hora: number = new Date().getHours()): TimeOfDay {
  if (hora >= 5 && hora < 12) return 'morning';
  if (hora >= 12 && hora < 18) return 'afternoon';
  if (hora >= 18 && hora < 22) return 'evening';
  return 'night';
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
  const etapas = p.etapas ?? [];
  const profile = etapas.length > 0
    ? selectWorkoutProfile(indexarRepeticoes(etapas.map(fromEtapaTreino)), {
        // O esporte não existe no contrato (mesma limitação do detalhe do coach): escala de corrida.
        sport: 'run',
        tss: p.tssPlanejado ?? null,
        if: p.intensidadePlanejada ?? null,
        zonaAlvoTreino: p.zonaAlvo ?? null,
      })
    : undefined;
  return {
    title: tipoTreinoLabel(p.tipoTreino),
    description: p.descricao ?? '',
    color: workoutTypeColor(p.tipoTreino),
    estimatedDuration: p.duracaoMin,
    profile,
  };
}

