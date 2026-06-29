import React, { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import BoltIcon from '@mui/icons-material/Bolt';
import { alpha } from '@mui/material/styles';
import { zones } from '../../../../theme/activeTheme';
import { surface, semantic, categorical } from '../../../../theme/tokens';
import { overlayBlack } from '../../../../theme/overlays';
import type { WorkoutBlock, BlockType } from './types';
import type { ZoneKey } from '../../../../theme/tokens';

// ── Block-type color overrides ─────────────────────────────────────
// These take priority over zone colors when blockType is set.
const blockTypeColors: Record<BlockType, { color: string; fill: string; border: string; label: string }> = {
  warmup:   { color: semantic.info[500],    fill: alpha(semantic.info[500], 0.18),    border: semantic.info[500],    label: 'Aquecimento' },
  main:     { color: categorical.cat6,      fill: alpha(categorical.cat6, 0.18),      border: categorical.cat6,      label: 'Principal' },
  cooldown: { color: semantic.warning[500], fill: alpha(semantic.warning[500], 0.18), border: semantic.warning[500], label: 'Desaquecimento' },
  interval: { color: semantic.danger[500],  fill: alpha(semantic.danger[500], 0.18),  border: semantic.danger[500],  label: 'Intervalo' },
  recovery: { color: surface[300],          fill: alpha(surface[300], 0.18),          border: surface[300],          label: 'Recuperação' },
};

interface WorkoutTimelineChartProps {
  blocks: WorkoutBlock[];
  title?: string;
}

// ── Zone height map (reflects intensity) ──────────────────────────
const zoneHeight: Record<ZoneKey, number> = {
  Z1: 55,
  Z2: 68,
  Z3: 85,
  Z4: 110,
  Z5: 128,
};

// ── Icon helper ────────────────────────────────────────────────────
function getIcon(hint?: string, color: string = surface[500]): React.ReactNode {
  const sx = { fontSize: 14, color };
  if (hint === 'warmup') return <LocalFireDepartmentIcon sx={sx} />;
  if (hint === 'cooldown') return <AcUnitIcon sx={sx} />;
  if (hint === 'main') return <DirectionsRunIcon sx={sx} />;
  return <BoltIcon sx={sx} />;
}

// ── Duration formatter ─────────────────────────────────────────────
function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

// ── Zone name helper ───────────────────────────────────────────────
function zoneName(key: ZoneKey): string {
  return `Zona ${key.replace('Z', '')} — ${zones[key].label}`;
}

export const WorkoutTimelineChart: React.FC<WorkoutTimelineChartProps> = ({ blocks, title = 'Timeline do Treino' }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalDurationMin = blocks.reduce((sum, b) => sum + b.durationMin, 0);

  // Dominant zone (highest zone with the most total time)
  const dominantZone = blocks.reduce<ZoneKey | null>((acc, b) => {
    if (!acc) return b.zoneKey;
    return b.zone > (parseInt(acc.replace('Z', '')) || 0) ? b.zoneKey : acc;
  }, null);

  // Zone legend: only zones present in current workout
  const presentZones = Array.from(new Set(blocks.map((b) => b.zoneKey))).sort();

  // Empty state
  if (blocks.length === 0 || totalDurationMin === 0) {
    return (
      <Box
        sx={{
          bgcolor: surface[0],
          border: `1px solid ${surface[300]}`,
          borderRadius: '10px',
          p: 2,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 3 }}
        >
          Nenhum bloco de treino para exibir
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: surface[0],
        border: `1px solid ${surface[300]}`,
        borderRadius: '10px',
        p: 2,
        position: 'relative',
      }}
    >
      {/* Card header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 'bold', color: 'text.primary' }}
        >
          {title}
        </Typography>
        {dominantZone && (
          <Chip
            label={`Z${dominantZone.replace('Z', '')} — ${zones[dominantZone].label}`}
            size="small"
            sx={{
              bgcolor: zones[dominantZone].fill,
              border: `1px solid ${zones[dominantZone].border}`,
              color: surface[700],
              fontSize: '0.75rem',
              fontWeight: 'bold',
              height: 20,
            }}
          />
        )}
      </Box>

      {/* Timeline bar container */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          width: '100%',
          height: 140,
          gap: '2px',
          mb: 1.5,
          position: 'relative',
        }}
      >
        {blocks.map((block) => {
          const widthPct = (block.durationMin / totalDurationMin) * 100;
          const showLabel = widthPct > 8;
          const isHovered = hoveredId === block.id;
          const zone = block.blockType ? blockTypeColors[block.blockType] : zones[block.zoneKey];
          const barHeight = zoneHeight[block.zoneKey];

          return (
            <Box
              key={block.id}
              onMouseEnter={() => setHoveredId(block.id)}
              onMouseLeave={() => setHoveredId(null)}
              sx={{
                width: `${widthPct}%`,
                height: `${barHeight}px`,
                bgcolor: zone.fill,
                border: `1.5px solid ${zone.border}`,
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default',
                transition: 'all 0.15s ease',
                position: 'relative',
                overflow: 'visible',
                boxSizing: 'border-box',
                '&:hover': {
                  bgcolor: alpha(zone.border, 0.30),
                  transform: 'scaleY(1.04)',
                  transformOrigin: 'bottom',
                  zIndex: 1,
                },
              }}
            >
              {showLabel && (
                <>
                  {getIcon(block.icon, zone.border)}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontSize: '10px',
                      color: surface[700],
                      textAlign: 'center',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      maxWidth: '90%',
                      mt: 0.25,
                      lineHeight: 1.2,
                    }}
                  >
                    {block.shortLabel || block.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: surface[500], mt: 0.25 }}
                  >
                    {formatDuration(block.durationMin)}
                  </Typography>
                </>
              )}

              {/* Tooltip */}
              {isHovered && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    mb: 1,
                    bgcolor: surface[700],
                    color: surface[50],
                    borderRadius: '6px',
                    px: 1.5,
                    py: 1,
                    zIndex: 10,
                    whiteSpace: 'nowrap',
                    boxShadow: `0 4px 12px ${overlayBlack[25]}`,
                    pointerEvents: 'none',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                    {block.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: surface[400] }}>
                    {formatDuration(block.durationMin)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: zone.border, fontWeight: 600, mt: 0.25, display: 'block' }}>
                    {zoneName(block.zoneKey)}
                  </Typography>
                  {block.description && (
                    <Typography variant="caption" sx={{ color: surface[400], mt: 0.25, display: 'block' }}>
                      {block.description}
                    </Typography>
                  )}
                  {/* Tooltip arrow */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: `5px solid ${surface[700]}`,
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Duration axis label */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, px: 0.25 }}>
        <Typography variant="caption" sx={{ color: surface[400] }}>
          0
        </Typography>
        <Typography variant="caption" sx={{ color: surface[400] }}>
          {formatDuration(totalDurationMin)}
        </Typography>
      </Box>

      {/* Zone legend */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {presentZones.map((zKey) => {
          const z = zones[zKey];
          const zoneBlocks = blocks.filter((b) => b.zoneKey === zKey);
          const zoneDuration = zoneBlocks.reduce((s, b) => s + b.durationMin, 0);
          const zonePct = Math.round((zoneDuration / totalDurationMin) * 100);

          return (
            <Box
              key={zKey}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: 0.5,
                border: `1px solid ${z.border}`,
                borderRadius: '4px',
                bgcolor: z.fill,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: z.border,
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: '10px', color: surface[700], fontWeight: 600, lineHeight: 1 }}>
                Z{zKey.replace('Z', '')} {z.label}
              </Typography>
              <Typography variant="caption" sx={{ color: surface[500] }}>
                {zonePct}%
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default WorkoutTimelineChart;
