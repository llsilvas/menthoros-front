import { Box } from '@mui/material';
import { activeTheme } from '../../../../theme/activeTheme';
import { formatDuration, formatTarget } from '../format';
import type { WorkoutProfile } from '../types';

const { workoutZoneLabel } = activeTheme;

/** Fora da tela, mas na árvore de acessibilidade — `display:none` some do leitor. */
const visualmenteOculto = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/**
 * Equivalente textual completo do gráfico (AC-12).
 *
 * Uma linha por bloco, com ordem, nome, duração, zona e alvo — é o que torna o
 * perfil auditável por quem não enxerga a forma, e é o que impede que a versão
 * falada seja um resumo mais pobre que o desenho.
 */
export function HiddenTable({ profile }: { profile: WorkoutProfile }) {
  return (
    <Box component="table" data-testid="profile-table" sx={visualmenteOculto}>
      <caption>Etapas do treino</caption>
      <thead>
        <tr>
          <th scope="col">Ordem</th>
          <th scope="col">Etapa</th>
          <th scope="col">Duração</th>
          <th scope="col">Zona</th>
          <th scope="col">Alvo</th>
        </tr>
      </thead>
      <tbody>
        {profile.blocks.map((b) => (
          <tr key={b.id} data-testid="profile-table-row">
            <td>{b.order + 1}</td>
            <td>{b.label}{b.repeat ? ` (repetição ${b.repeat.index} de ${b.repeat.total})` : ''}</td>
            <td>{formatDuration(b.durationSec)}</td>
            <td>{b.confidence === 'unknown' ? 'não informada' : `${b.zone} · ${workoutZoneLabel[b.zone]}`}</td>
            <td>{formatTarget(b.target) ?? 'sem prescrição'}</td>
          </tr>
        ))}
      </tbody>
    </Box>
  );
}
