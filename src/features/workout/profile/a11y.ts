// Texto de acessibilidade derivado do perfil. Fora do arquivo de componente
// porque é função pura — e porque o `react-refresh` exige que módulos de
// componente exportem só componentes.

import { activeTheme } from '../../../theme/activeTheme';
import { formatDuration } from './format';
import type { WorkoutProfile } from './types';

const { workoutZoneLabel } = activeTheme;

/**
 * Resumo falado, gerado do MESMO perfil que desenha o gráfico — pelo mesmo
 * motivo que a badge e a distribuição saem do mesmo retorno: duas descrições do
 * mesmo treino que podem divergir acabam divergindo.
 */
export function ariaLabelDoPerfil(profile: WorkoutProfile): string {
  const { metrics: m } = profile;
  if (profile.blocks.length === 0) return 'Perfil do treino. Sem etapas estruturadas.';

  const partes = [
    'Perfil do treino.',
    `${formatDuration(m.totalDurationSec)}, ${m.blockCount} ${m.blockCount === 1 ? 'bloco' : 'blocos'}.`,
  ];

  if (m.targetZone && !profile.degraded) {
    partes.push(
      `Zona-alvo ${m.targetZone}, ${workoutZoneLabel[m.targetZone].toLowerCase()}, ${formatDuration(m.targetZoneSeconds)}.`,
    );
  }
  if (profile.degraded) {
    partes.push('Intensidade estimada — sem prescrição no plano.');
  }
  if (m.distribution.length > 0) {
    partes.push(
      `Distribuição: ${m.distribution.map((d) => `${d.zone} ${Math.round(d.share * 100)}%`).join(', ')}.`,
    );
  }

  return partes.join(' ');
}
