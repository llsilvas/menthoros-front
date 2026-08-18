import { Box } from '@mui/material';
import { activeTheme } from '../../../../theme/activeTheme';
import { formatDuration, formatWorkRatio } from '../format';
import type { WorkoutProfile } from '../types';
import type { ProfileVariant } from '../useResolvedVariant';
import { METRICAS_PADRAO, type HeaderMetric } from '../headerMetrics';

const { workoutZone, workoutZoneLabel, workoutProfileChrome: chrome, workoutProfileType: type, workoutProfileSpace: space } = activeTheme;

interface ProfileHeaderProps {
  profile: WorkoutProfile;
  variant: ProfileVariant;
  title: string;
  metrics?: HeaderMetric[];
}

export function ProfileHeader({ profile, variant, title, metrics = METRICAS_PADRAO }: ProfileHeaderProps) {
  const { metrics: m, degraded } = profile;
  const permitidas = variant === 'compact' ? metrics.filter((k) => k === 'duration' || k === 'blocks') : metrics;
  const chips = permitidas.map((k) => textoDaMetrica(k, profile)).filter((t): t is string => t !== null);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: `${space.chipGap}px`, mb: `${space.headerGap}px` }}>
      {variant === 'full' && (
        <Box
          component="h3"
          sx={{
            m: 0, mr: 'auto',
            color: activeTheme.surface[50],
            fontFamily: type.headerTitle.family,
            fontSize: type.headerTitle.size,
            fontWeight: type.headerTitle.weight,
          }}
        >
          {title}
        </Box>
      )}

      {/* A badge é o ÚNICO elemento caixa-alta da superfície inteira (AC-8). O
          prefixo "ALVO" impede a leitura de que o treino todo é daquela zona. */}
      {m.targetZone && !degraded && (
        <Box
          component="span"
          data-testid="target-zone-badge"
          data-zone={m.targetZone}
          sx={{
            px: '6px', py: '2px', borderRadius: '4px',
            color: workoutZone[m.targetZone],
            border: `1px solid ${workoutZone[m.targetZone]}`,
            fontFamily: type.badge.family,
            fontSize: type.badge.size,
            fontWeight: type.badge.weight,
            letterSpacing: type.badge.tracking,
            textTransform: 'uppercase',
          }}
        >
          ALVO · {m.targetZone}
        </Box>
      )}

      <Box
        data-testid="header-chips"
        sx={{
          width: '100%',
          display: 'flex', flexWrap: 'wrap', gap: `${space.chipGap}px`,
          color: chrome.axisLabelColor,
          fontFamily: type.headerChip.family,
          fontSize: type.headerChip.size,
          fontWeight: type.headerChip.weight,
          letterSpacing: type.headerChip.tracking,
        }}
      >
        {chips.map((texto, i) => (
          <Box component="span" key={texto} data-testid="header-chip">
            {i > 0 && <Box component="span" aria-hidden sx={{ mr: `${space.chipGap}px` }}>·</Box>}
            {texto}
          </Box>
        ))}

        {degraded && (
          <Box component="span" data-testid="chip-degraded" sx={{ color: activeTheme.semantic.warning }}>
            ⚠ intensidade estimada
          </Box>
        )}
        {profile.droppedBlocks > 0 && (
          <Box component="span" data-testid="chip-dropped" sx={{ color: activeTheme.semantic.warning }}>
            ⚠ {profile.droppedBlocks} {profile.droppedBlocks === 1 ? 'etapa sem duração' : 'etapas sem duração'}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function textoDaMetrica(chave: HeaderMetric, { metrics: m }: WorkoutProfile): string | null {
  switch (chave) {
    case 'duration':
      return m.totalDurationSec > 0 ? formatDuration(m.totalDurationSec) : null;
    case 'blocks':
      return m.blockCount > 0 ? `${m.blockCount} ${m.blockCount === 1 ? 'bloco' : 'blocos'}` : null;
    case 'targetZoneTime':
      return m.targetZone
        ? `${formatDuration(m.targetZoneSeconds)} em ${m.targetZone} · ${workoutZoneLabel[m.targetZone]}`
        : null;
    case 'workRatio':
      return formatWorkRatio(m.workToRecoveryRatio);
    // Na tela de revisão o IF nunca vem: `TreinoPlanejadoDto` não tem
    // `intensidadePlanejada` (DEP-5). Omitir é a regra — derivar um IF da
    // distribuição de zonas seria um número que o treinador leria como vindo
    // do motor de treino.
    case 'if':
      return m.intensityFactor !== null ? `IF ${m.intensityFactor.toFixed(2)}` : null;
    case 'tss':
      return m.tss !== null ? `TSS ${Math.round(m.tss)}` : null;
  }
}
