// Perfil do modo treino a partir das etapas do TreinoHojeDto — mesmo motor visual do perfil
// (Home/Plano), mas os alvos já vêm resolvidos do backend: aqui só se reaproveita o desenho.

import { buildProfileFromTreino } from '../../workout/profile';
import type { WorkoutProfileData } from '../../workout/profile';
import type { EtapaTreino } from '../../../types/TreinoPlanejado';
import type { EtapaAlvo } from '../../../types/AthleteWorkoutToday';

function paraEtapaTreino(e: EtapaAlvo): EtapaTreino {
  return {
    ordem: e.ordem,
    tipoEtapa: e.tipoEtapa ?? '',
    descricaoEtapa: e.descricao,
    duracaoMin: e.duracaoMin,
    distanciaKm: e.distanciaKm,
    blocoId: e.blocoId,
    blocoRepeticoes: e.blocoRepeticoes,
  };
}

export function buildTodayWorkoutProfile(
  etapas: EtapaAlvo[] | undefined,
  ctx: { zonaAlvo?: string | null },
): WorkoutProfileData | undefined {
  return buildProfileFromTreino(etapas?.map(paraEtapaTreino), { zonaAlvo: ctx.zonaAlvo });
}

/** Alvo efetivo da etapa como texto pronto para exibir; `null` quando não há alvo confiável. */
export function formatAlvoEtapa(e: Pick<EtapaAlvo, 'alvoPrimario' | 'fcAlvoMin' | 'fcAlvoMax' | 'paceAlvo'>): string | null {
  switch (e.alvoPrimario) {
    case 'FC':
      return e.fcAlvoMin != null && e.fcAlvoMax != null ? `${e.fcAlvoMin}–${e.fcAlvoMax} bpm` : null;
    case 'PACE':
      return e.paceAlvo ? `${e.paceAlvo} /km` : null;
    default:
      return null;
  }
}
