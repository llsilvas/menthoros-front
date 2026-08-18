import { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Button, type SxProps, type Theme } from '@mui/material';
import { activeTheme } from '../../../theme/activeTheme';
import { formatDuration, formatTarget } from './format';
import { ProfilePlot } from './parts/ProfilePlot';
import { ProfileHeader } from './parts/ProfileHeader';
import type { HeaderMetric } from './headerMetrics';
import { HiddenTable } from './parts/ProfileA11y';
import { ariaLabelDoPerfil } from './a11y';
import { useResolvedVariant, type VariantProp } from './useResolvedVariant';
import type { ProfileBlock, WorkoutProfile as WorkoutProfileData, ZoneKey } from './types';

const {
  workoutZone, workoutZoneLabel,
  workoutProfileChrome: chrome,
  workoutProfileType: type,
  workoutProfileSpace: space,
  content, surface,
} = activeTheme;

export interface WorkoutProfileProps {
  /** Perfil já resolvido. Único caminho de dado — sem cálculo interno. */
  profile: WorkoutProfileData;
  variant?: VariantProp;
  state?: 'idle' | 'loading';
  title?: string;
  /** Fornecido, o componente é CONTROLADO: hover e teclado só emitem o evento. */
  activeBlockId?: string | null;
  onActiveBlockChange?: (blockId: string | null) => void;
  onBlockSelect?: (block: ProfileBlock) => void;
  onAddBlocks?: () => void;
  headerMetrics?: HeaderMetric[];
  showDistribution?: boolean;
  'aria-label'?: string;
  sx?: SxProps<Theme>;
  'data-testid'?: string;
}

export function WorkoutProfile({
  profile,
  variant: variantProp = 'auto',
  state = 'idle',
  title = 'Perfil do treino',
  activeBlockId: activeControlado,
  onActiveBlockChange,
  onBlockSelect,
  onAddBlocks,
  headerMetrics,
  showDistribution = true,
  'aria-label': ariaLabelProp,
  sx,
  'data-testid': testId = 'workout-profile',
}: WorkoutProfileProps) {
  const { ref, variant } = useResolvedVariant(variantProp);
  const [activeInterno, setActiveInterno] = useState<string | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);

  const controlado = activeControlado !== undefined;
  const activeBlockId = controlado ? activeControlado ?? null : activeInterno;

  const ativar = useCallback((id: string | null) => {
    if (!controlado) setActiveInterno(id);
    onActiveBlockChange?.(id);
  }, [controlado, onActiveBlockChange]);

  const blocoAtivo = useMemo(
    () => profile.blocks.find((b) => b.id === activeBlockId) ?? null,
    [profile.blocks, activeBlockId],
  );

  const semChrome = variant === 'sparkline';
  const molduraSx: SxProps<Theme> = semChrome
    ? { ...(sx as object) }
    : {
        // Uma única superfície com borda na região do perfil (AC-8): sem cards
        // aninhados, sem eyebrow externo.
        p: `${space.cardPadding[variant]}px`,
        borderRadius: `${space.cardRadius}px`,
        border: `1px solid ${content.cardBorder}`,
        bgcolor: activeTheme.backgrounds?.card ?? surface[700],
        ...(sx as object),
      };

  if (state === 'loading') {
    return (
      <Box ref={ref} data-testid={`${testId}-skeleton`} sx={molduraSx}>
        <Skeleton variant={variant} />
      </Box>
    );
  }

  if (profile.blocks.length === 0) {
    return (
      <Box ref={ref} data-testid={`${testId}-empty`} sx={molduraSx}>
        <ProfileHeader profile={profile} variant={variant} title={title} metrics={headerMetrics} />
        {/* Altura preservada: sem isso, a lista pula de layout entre um treino
            com etapas e outro sem. */}
        <Box
          sx={{
            height: `${space.plotHeight[variant]}px`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
            borderBottom: `${chrome.baselineWidthPx}px solid ${chrome.baselineColor}`,
            color: chrome.axisLabelColor,
            fontFamily: type.tooltipBody.family,
            fontSize: type.tooltipBody.size,
          }}
        >
          {profile.droppedBlocks > 0
            ? 'Etapas sem duração informada.'
            : 'Este treino não tem etapas estruturadas.'}
          {onAddBlocks && <Button size="small" onClick={onAddBlocks}>Adicionar etapas</Button>}
        </Box>
      </Box>
    );
  }

  return (
    <Box ref={ref} data-testid={testId} sx={molduraSx}>
      {variant !== 'sparkline' && (
        <ProfileHeader profile={profile} variant={variant} title={title} metrics={headerMetrics} />
      )}

      <Box
        ref={plotRef}
        role="img"
        aria-label={ariaLabelProp ?? ariaLabelDoPerfil(profile)}
        // Um único tab stop com foco itinerante por dentro: 12 tab stops num
        // treino de 12 blocos tornaria a navegação da página inutilizável.
        tabIndex={variant === 'sparkline' ? -1 : 0}
        onKeyDown={(e) => aoTeclar(e, profile.blocks, activeBlockId, ativar, onBlockSelect)}
        onBlur={() => ativar(null)}
        sx={{
          position: 'relative',
          outline: 'none',
          '&:focus-visible': {
            outline: `${chrome.focusRingWidthPx}px solid ${chrome.focusRingColor}`,
            outlineOffset: `${chrome.focusRingOffsetPx}px`,
            borderRadius: '2px',
          },
        }}
      >
        <ProfilePlot
          profile={profile}
          variant={variant}
          activeBlockId={activeBlockId}
          onActivate={ativar}
          onSelect={onBlockSelect}
        />

        {blocoAtivo && <Tooltip block={blocoAtivo} total={profile.blocks.length} />}
      </Box>

      <Box aria-live="polite" style={visualmenteOculto}>
        {blocoAtivo ? `${blocoAtivo.label}, bloco ${blocoAtivo.order + 1} de ${profile.blocks.length}` : ''}
      </Box>

      {showDistribution && variant !== 'sparkline' && <DistributionBar profile={profile} />}

      <HiddenTable profile={profile} />
    </Box>
  );
}

const visualmenteOculto = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
} as const;

function aoTeclar(
  e: React.KeyboardEvent,
  blocos: ProfileBlock[],
  ativoId: string | null,
  ativar: (id: string | null) => void,
  onSelect?: (b: ProfileBlock) => void,
) {
  const atual = blocos.findIndex((b) => b.id === ativoId);
  const irPara = (i: number) => {
    e.preventDefault();
    ativar(blocos[Math.min(blocos.length - 1, Math.max(0, i))].id);
  };

  switch (e.key) {
    case 'ArrowRight': return irPara(atual < 0 ? 0 : atual + 1);
    case 'ArrowLeft':  return irPara(atual < 0 ? 0 : atual - 1);
    case 'Home':       return irPara(0);
    case 'End':        return irPara(blocos.length - 1);
    // O atalho de "onde começa o trabalho?" num intervalado longo: pular para o
    // próximo bloco de zona diferente, em vez de percorrer dez repetições.
    case 'ArrowUp':
    case 'ArrowDown': {
      e.preventDefault();
      const base = atual < 0 ? 0 : atual;
      const passo = e.key === 'ArrowUp' ? 1 : -1;
      for (let i = base + passo; i >= 0 && i < blocos.length; i += passo) {
        if (blocos[i].zone !== blocos[base].zone) return ativar(blocos[i].id);
      }
      return;
    }
    case 'Enter':
    case ' ':
      if (atual >= 0 && onSelect) { e.preventDefault(); onSelect(blocos[atual]); }
      return;
    case 'Escape':
      return ativar(null);
  }
}

function Tooltip({ block, total }: { block: ProfileBlock; total: number }) {
  const alvo = formatTarget(block.target);
  return (
    <Box
      data-testid="block-tooltip"
      role="status"
      sx={{
        position: 'absolute', top: 0, left: 0, zIndex: 2,
        px: 1, py: 0.75,
        bgcolor: chrome.tooltipBg,
        border: `1px solid ${chrome.tooltipBorder}`,
        borderRadius: '6px',
        pointerEvents: 'none',
        color: surface[50],
      }}
    >
      <Box sx={{ fontFamily: type.tooltipTitle.family, fontSize: type.tooltipTitle.size, fontWeight: type.tooltipTitle.weight }}>
        {block.label}
      </Box>
      <Box sx={{ fontFamily: type.tooltipBody.family, fontSize: type.tooltipBody.size, color: chrome.axisLabelColor }}>
        bloco {block.order + 1} de {total}
      </Box>
      <Box sx={{ fontFamily: type.tooltipData.family, fontSize: type.tooltipData.size }}>
        {formatDuration(block.durationSec)}
      </Box>
      <Box sx={{ fontFamily: type.tooltipBody.family, fontSize: type.tooltipBody.size, color: workoutZone[block.zone] }}>
        {block.confidence === 'unknown' ? 'zona não informada' : `${block.zone} · ${workoutZoneLabel[block.zone]}`}
      </Box>
      {alvo && (
        <Box sx={{ fontFamily: type.tooltipData.family, fontSize: type.tooltipData.size }}>{alvo}</Box>
      )}
      {block.repeat && (
        <Box sx={{ fontFamily: type.tooltipBody.family, fontSize: type.tooltipBody.size, color: chrome.axisLabelColor }}>
          repetição {block.repeat.index} de {block.repeat.total}
        </Box>
      )}
    </Box>
  );
}

/**
 * Barra de distribuição, derivada do MESMO `metrics` de onde sai a badge — é o
 * que torna impossível a badge dizer uma zona e a legenda dizer outra.
 */
function DistributionBar({ profile }: { profile: WorkoutProfileData }) {
  const { degraded, metrics } = profile;
  const fatias = degraded
    ? (metrics.kindDistribution ?? []).map((k) => ({ chave: k.kind, share: k.share, cor: chrome.axisTickColor }))
    : metrics.distribution.map((d) => ({ chave: d.zone, share: d.share, cor: workoutZone[d.zone as ZoneKey] }));

  if (fatias.length === 0) return null;

  return (
    <Box data-testid="distribution" sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
        {fatias.map((f) => (
          <Box key={f.chave} data-testid="distribution-slice" sx={{ width: `${f.share * 100}%`, bgcolor: f.cor }} />
        ))}
      </Box>
      <Box
        data-testid="distribution-legend"
        sx={{
          display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.75,
          color: chrome.axisLabelColor,
          fontFamily: type.headerChip.family,
          fontSize: type.headerChip.size,
        }}
      >
        {degraded && <Box component="span">por etapa:</Box>}
        {fatias.map((f) => (
          <Box component="span" key={f.chave}>{f.chave} {Math.round(f.share * 100)}%</Box>
        ))}
      </Box>
    </Box>
  );
}

/** Alturas variadas de propósito: um skeleton plano ensina o olho a esperar um gráfico plano. */
const ALTURAS_SKELETON = [0.3, 0.7, 0.35, 0.7, 0.35, 0.4];

function Skeleton({ variant }: { variant: 'full' | 'compact' | 'sparkline' }) {
  return (
    <Box>
      {variant === 'full' && (
        <Box sx={{ display: 'flex', gap: 1, mb: `${space.headerGap}px` }}>
          <Box sx={{ width: 120, height: 14, borderRadius: '4px', bgcolor: chrome.gridlineColor }} />
          <Box sx={{ width: 64, height: 14, borderRadius: '4px', bgcolor: chrome.gridlineColor, ml: 'auto' }} />
        </Box>
      )}
      <Box
        sx={{
          display: 'flex', alignItems: 'flex-end', gap: '1px',
          height: `${space.plotHeight[variant]}px`,
          bgcolor: chrome.plotBg,
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'workout-profile-pulse 1.4s ease-in-out infinite',
          },
          '@keyframes workout-profile-pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
        }}
      >
        {ALTURAS_SKELETON.map((h, i) => (
          <Box key={i} sx={{ flex: 1, height: `${h * 100}%`, bgcolor: chrome.gridlineColor }} />
        ))}
      </Box>
    </Box>
  );
}
