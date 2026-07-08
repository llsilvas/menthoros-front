import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import BoltIcon from '@mui/icons-material/Bolt';
import { zones, activeTheme } from '../../../../theme/activeTheme';
import { surface } from '../../../../theme/tokens';
import { overlayBlack, overlayWhite } from '../../../../theme/overlays';
import type { WorkoutBlock, BlockType } from './types';
import type { ZoneKey } from '../../../../theme/tokens';

// ── Paleta de etapas — âncora canônica do sistema Menthoros ─────────
const { trainingStage } = activeTheme;

const blockTypeColors: Record<BlockType, { color: string; fill: string; border: string; label: string }> = {
  warmup:   { color: trainingStage.aquecimento,    fill: `${trainingStage.aquecimento}2E`,    border: trainingStage.aquecimento,    label: 'Aquecimento' },
  main:     { color: trainingStage.principal,      fill: `${trainingStage.principal}2E`,      border: trainingStage.principal,      label: 'Principal' },
  cooldown: { color: trainingStage.desaquecimento, fill: `${trainingStage.desaquecimento}2E`, border: trainingStage.desaquecimento, label: 'Desaquecimento' },
  interval: { color: trainingStage.esforco,        fill: `${trainingStage.esforco}2E`,        border: trainingStage.esforco,        label: 'Intervalo' },
  recovery: { color: trainingStage.recuperacao,    fill: `${trainingStage.recuperacao}2E`,    border: trainingStage.recuperacao,    label: 'Recuperação' },
};

interface WorkoutTimelineChartProps {
  blocks: WorkoutBlock[];
  title?: string;
}

// ── Altura por zona — reflete intensidade ───────────────────────────
const zoneHeight: Record<ZoneKey, number> = {
  Z1: 65,
  Z2: 68,
  Z3: 85,
  Z4: 120,
  Z5: 128,
};

// ── Ícone por tipo de bloco ─────────────────────────────────────────
function getIcon(hint?: string, color: string = surface[500]): React.ReactNode {
  const sx = { fontSize: 20, color };
  if (hint === 'warmup') return <LocalFireDepartmentIcon sx={sx} />;
  if (hint === 'cooldown') return <AcUnitIcon sx={sx} />;
  if (hint === 'main') return <DirectionsRunIcon sx={sx} />;
  return <BoltIcon sx={sx} />;
}

// ── Formata minutos ─────────────────────────────────────────────────
function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

// ── Nome da zona ────────────────────────────────────────────────────
function zoneName(key: ZoneKey): string {
  return `Zona ${key.replace('Z', '')} — ${zones[key].label}`;
}

// ── Estilo do container — glass card sobre dark canvas ───────────────
const containerSx = {
  bgcolor:      overlayWhite[5],
  border:       `1px solid ${overlayWhite[12]}`,
  borderRadius: '8px',
  p: 1.5,
  position:     'relative',
} as const;

// ── Rótulo de seção — monospace uppercase, não compete com cabeçalho do dialog
const sectionLabelSx = {
  fontSize:      '0.62rem',
  fontWeight:    700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontFamily:    'monospace',
  color:          surface[400],
} as const;

export const WorkoutTimelineChart: React.FC<WorkoutTimelineChartProps> = ({ blocks, title = 'Timeline do Treino' }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalDurationMin = blocks.reduce((sum, b) => sum + b.durationMin, 0);

  const dominantZone = blocks.reduce<ZoneKey | null>((acc, b) => {
    if (!acc) return b.zoneKey;
    return b.zone > (parseInt(acc.replace('Z', '')) || 0) ? b.zoneKey : acc;
  }, null);

  const presentZones = Array.from(new Set(blocks.map((b) => b.zoneKey))).sort();

  if (blocks.length === 0 || totalDurationMin === 0) {
    return (
      <Box sx={{ ...containerSx, position: undefined }}>
        <Typography sx={{ ...sectionLabelSx, mb: 1.5 }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: surface[500], fontStyle: 'italic', textAlign: 'center', py: 2.5, fontSize: '0.75rem' }}
        >
          Nenhum bloco de treino para exibir
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={containerSx}>
      {/* Cabeçalho — rótulo + zona dominante */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={sectionLabelSx}>
          {title}
        </Typography>
        {dominantZone && (
          <Box
            sx={{
              px: 0.75,
              py: 0.2,
              borderRadius: '4px',
              bgcolor: `${zones[dominantZone].border}1F`,
              border: `1px solid ${zones[dominantZone].border}4D`,
              fontSize: '0.6rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              color: zones[dominantZone].border,
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            Z{dominantZone.replace('Z', '')} {zones[dominantZone].label}
          </Box>
        )}
      </Box>

      {/* Barras da timeline */}
      <Box
        sx={{
          display:   'flex',
          alignItems: 'flex-end',
          width:      '100%',
          height:     70,
          gap:        '2px',
          mb:         1,
          position:   'relative',
        }}
      >
        {blocks.map((block) => {
          const widthPct  = (block.durationMin / totalDurationMin) * 100;
          const showLabel = widthPct > 5;
          const isHovered = hoveredId === block.id;
          const zone      = block.blockType ? blockTypeColors[block.blockType] : zones[block.zoneKey];
          const barHeight = zoneHeight[block.zoneKey];

          return (
            <Box
              key={block.id}
              onMouseEnter={() => setHoveredId(block.id)}
              onMouseLeave={() => setHoveredId(null)}
              sx={{
                width:          `${widthPct}%`,
                height:         `${barHeight}px`,
                // Mesmo padrão do BlocoCard: borda esquerda acentuada + fill sutil
                borderLeft:     `3px solid ${zone.border}`,
                borderRight:    `1px solid ${zone.border}26`,
                borderTop:      `1px solid ${zone.border}26`,
                borderBottom:   `1px solid ${zone.border}26`,
                borderRadius:   '0 4px 4px 0',
                bgcolor:        `${zone.border}14`,
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                justifyContent:  'center',
                cursor:          'default',
                transition:      'all 0.15s ease',
                position:        'relative',
                overflow:        'visible',
                boxSizing:       'border-box',
                '&:hover': {
                  bgcolor:         `${zone.border}2E`,
                  transform:       'scaleY(1.04)',
                  transformOrigin: 'bottom',
                  zIndex:          1,
                },
              }}
            >
              {showLabel && (
                <>
                  {getIcon(block.icon, zone.border)}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight:    700,
                      fontSize:      '10px',
                      color:          surface[50],
                      textAlign:     'center',
                      overflow:      'hidden',
                      whiteSpace:    'nowrap',
                      textOverflow:  'ellipsis',
                      maxWidth:      '90%',
                      mt:             0.25,
                      lineHeight:     1.2,
                    }}
                  >
                    {block.shortLabel || block.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: surface[400], mt: 0.25, fontSize: '9px' }}
                  >
                    {formatDuration(block.durationMin)}
                  </Typography>
                </>
              )}

              {/* Tooltip hover */}
              {isHovered && (
                <Box
                  sx={{
                    position:     'absolute',
                    bottom:       '100%',
                    left:         '50%',
                    transform:    'translateX(-50%)',
                    mb:            1,
                    bgcolor:       surface[700],
                    border:       `1px solid ${overlayWhite[15]}`,
                    color:         surface[50],
                    borderRadius: '6px',
                    px:            1.5,
                    py:            1,
                    zIndex:        10,
                    whiteSpace:   'nowrap',
                    boxShadow:    `0 4px 12px ${overlayBlack[25]}`,
                    pointerEvents: 'none',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25, fontSize: '0.75rem' }}>
                    {block.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: surface[400], display: 'block' }}>
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
                  {/* Seta do tooltip */}
                  <Box
                    sx={{
                      position:    'absolute',
                      top:         '100%',
                      left:        '50%',
                      transform:   'translateX(-50%)',
                      width:        0,
                      height:       0,
                      borderLeft:  '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop:  `5px solid ${surface[700]}`,
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Eixo de duração */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, px: 0.25 }}>
        <Typography variant="caption" sx={{ color: surface[500], fontSize: '0.6rem', fontFamily: 'monospace' }}>
          0
        </Typography>
        <Typography variant="caption" sx={{ color: surface[500], fontSize: '0.6rem', fontFamily: 'monospace' }}>
          {formatDuration(totalDurationMin)}
        </Typography>
      </Box>

      {/* Legenda de zonas presentes */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {presentZones.map((zKey) => {
          const z           = zones[zKey];
          const zoneDuration = blocks.filter((b) => b.zoneKey === zKey).reduce((s, b) => s + b.durationMin, 0);
          const zonePct      = Math.round((zoneDuration / totalDurationMin) * 100);

          return (
            <Box
              key={zKey}
              sx={{
                display:     'flex',
                alignItems:  'center',
                gap:          0.75,
                px:           0.75,
                py:           0.3,
                border:      `1px solid ${z.border}4D`,
                borderRadius: '4px',
                bgcolor:      z.fill,
              }}
            >
              <Box
                sx={{
                  width:       7,
                  height:      7,
                  borderRadius: '50%',
                  bgcolor:      z.border,
                  flexShrink:   0,
                }}
              />
              <Typography
                sx={{
                  fontSize:      '0.6rem',
                  fontFamily:    'monospace',
                  fontWeight:    600,
                  letterSpacing: '0.04em',
                  color:          surface[50],
                  lineHeight:     1,
                }}
              >
                Z{zKey.replace('Z', '')} {z.label}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', fontFamily: 'monospace', color: surface[400] }}>
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
