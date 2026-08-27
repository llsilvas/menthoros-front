import type { EtapaTreino } from '../../../types/TreinoPlanejado';
import { fromEtapaTreino, indexarRepeticoes } from './input';
import { selectWorkoutProfile } from './selectWorkoutProfile';
import type { WorkoutProfile } from './types';

export interface TreinoProfileContext {
  tssPlanejado?: number | null;
  intensidadePlanejada?: number | null;
  zonaAlvo?: string | null;
}

/**
 * Perfil de um treino planejado a partir das etapas do contrato — o único caminho para a Home do
 * atleta (hero), o drawer do Plano e qualquer tela futura: ordena por `ordem` (o backend já ordena,
 * mas a borda não depende disso), deriva o índice das repetições (`indexarRepeticoes`) e resolve o
 * perfil. `undefined` sem etapas: ausência honesta, sem placeholder.
 *
 * TODO(DEP-3): o esporte não existe no contrato (nem `TreinoPlanejado` nem `TreinoPlanejadoDto`
 * carregam modalidade), então todo treino é normalizado na escala de corrida — inclusive bike e
 * natação. Os `thresholds` do atleta também não chegam pelo `me/home`/plano; quando chegarem,
 * entram aqui, uma vez, e as duas telas mudam juntas.
 */
export function buildProfileFromTreino(etapas: EtapaTreino[] | undefined, ctx: TreinoProfileContext): WorkoutProfile | undefined {
  if (!etapas || etapas.length === 0) return undefined;
  const ordenadas = [...etapas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  return selectWorkoutProfile(indexarRepeticoes(ordenadas.map(fromEtapaTreino)), {
    sport: 'run',
    tss: ctx.tssPlanejado ?? null,
    if: ctx.intensidadePlanejada ?? null,
    zonaAlvoTreino: ctx.zonaAlvo ?? null,
  });
}
