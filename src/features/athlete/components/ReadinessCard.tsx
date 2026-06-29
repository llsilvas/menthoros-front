import { Box, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { surface } from '../../../theme/tokens';
import { activeTheme } from '../../../theme/activeTheme';
import { elevation } from '../../../shared/design-tokens';

export interface ReadinessCardProps {
  score: number; // 0-100
  factors: {
    recovery: number;
    fatigue: number;
    sleep?: number;
    hrv?: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  recommendation?: string;
}

interface ReadinessLevel {
  label: string;
  color: string;
}

function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return { label: 'Ótima',    color: activeTheme.readiness.optimal  };
  if (score >= 70) return { label: 'Alta',     color: activeTheme.readiness.good      };
  if (score >= 40) return { label: 'Moderada', color: activeTheme.readiness.caution   };
  return               { label: 'Baixa',    color: activeTheme.readiness.critical  };
}

interface TrendConfig {
  icon: React.ReactNode;
  label: string;
}

function getTrendConfig(trend: ReadinessCardProps['trend']): TrendConfig {
  switch (trend) {
    case 'improving':
      return { icon: <TrendingUpIcon sx={{ fontSize: 16 }} />, label: 'Melhorando' };
    case 'declining':
      return { icon: <TrendingDownIcon sx={{ fontSize: 16 }} />, label: 'Caindo' };
    case 'stable':
    default:
      return { icon: <TrendingFlatIcon sx={{ fontSize: 16 }} />, label: 'Estável' };
  }
}

const TOOLTIP_EXPLANATION =
  'A prontidão combina recuperação muscular, nível de fadiga acumulada, qualidade do sono e variabilidade da frequência cardíaca (HRV). Quanto maior o valor, mais preparado você está para treinar com alta intensidade.';

export function ReadinessCard({ score, trend, recommendation }: ReadinessCardProps) {
  const { label, color } = getReadinessLevel(score);
  const { icon: TrendIcon, label: trendLabel } = getTrendConfig(trend);

  return (
    <Box
      sx={{
        bgcolor: elevation.card,
        borderRadius: 1,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          sx={{
            color: surface[50],
            fontSize: '0.9rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Prontidão
        </Typography>
        <Tooltip title={TOOLTIP_EXPLANATION} arrow placement="top">
          <InfoOutlinedIcon sx={{ color: surface[400], fontSize: 18, cursor: 'help' }} />
        </Tooltip>
      </Box>

      {/* Círculo com score */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: `3px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color,
              lineHeight: 1,
            }}
          >
            {Math.round(score)}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color,
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Tendência */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: surface[400],
        }}
      >
        {TrendIcon}
        <Typography sx={{ fontSize: '0.82rem', color: surface[400] }}>
          Tendência:{' '}
          <Box component="span" sx={{ color: surface[50], fontWeight: 600 }}>
            {trendLabel}
          </Box>
        </Typography>
      </Box>

      {/* Recomendação */}
      {recommendation && (
        <Typography
          sx={{
            fontSize: '0.82rem',
            color: surface[400],
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          &ldquo;{recommendation}&rdquo;
        </Typography>
      )}
    </Box>
  );
}

export default ReadinessCard;
