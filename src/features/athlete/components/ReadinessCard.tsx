import { Box, Typography } from '@mui/material';
import { surface } from '../../../theme/tokens';
import { activeTheme } from '../../../theme/activeTheme';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';

export interface ReadinessCardProps {
  score: number; // 0-100
  recommendation?: string;
  /** Mostra a origem ("com base no seu check-in") só quando há check-in de hoje — não afirma o que não sabe. */
  comCheckinHoje?: boolean;
}

interface ReadinessLevel {
  label: string;
  color: string;
}

// Bandas herdadas do card anterior; o backend é dono da classificação oficial (NivelProntidao) —
// aqui é só apresentação do score 0–100 que o `me/readiness` devolve.
function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return { label: 'ótima',    color: activeTheme.readiness.optimal  };
  if (score >= 70) return { label: 'alta',     color: activeTheme.readiness.good      };
  if (score >= 40) return { label: 'moderada', color: activeTheme.readiness.caution   };
  return               { label: 'baixa',    color: activeTheme.readiness.critical  };
}

const RAIO = 24;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

/** Prontidão em uma linha (D1): anel de 56px, rótulo e recomendação — não um bloco centralizado. */
export function ReadinessCard({ score, recommendation, comCheckinHoje = false }: ReadinessCardProps) {
  const { label, color } = getReadinessLevel(score);
  const pct = Math.max(0, Math.min(100, score));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, bgcolor: elevation.card, border: `1px solid ${surface[700]}`, borderRadius: radius.lg, px: 2, py: 1.75 }}>
      <Box role="img" aria-label={`Prontidão ${Math.round(score)} de 100, ${label}`} sx={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
        <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
          <circle cx="28" cy="28" r={RAIO} fill="none" stroke={surface[700]} strokeWidth="5" />
          <circle
            cx="28" cy="28" r={RAIO} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
            transform="rotate(-90 28 28)"
          />
        </svg>
        <Typography
          variant="h6"
          aria-hidden
          sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.round(score)}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>Prontidão {label}</Typography>
          {comCheckinHoje && (
            <Typography variant="caption" sx={{ color: surface[500] }}>com base no seu check-in</Typography>
          )}
        </Box>
        {recommendation && (
          <Typography variant="body2" sx={{ color: surface[400] }}>{recommendation}</Typography>
        )}
      </Box>
    </Box>
  );
}

export default ReadinessCard;
