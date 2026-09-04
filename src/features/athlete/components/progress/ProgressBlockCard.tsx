import type { ReactNode } from 'react';
import { Box, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { elevation } from '../../../../shared/design-tokens';
import { radius } from '../../../../shared/design-tokens/density';
import { surface } from '../../../../theme/tokens';
import { ROUTES } from '../../../../constants/routes';

export interface ProgressBlockCardProps {
  pergunta: string;
  periodo?: string;
  testId: string;
  children: ReactNode;
  /** Ação secundária à esquerda do "Falar com o coach" (ex.: expandir o gráfico). */
  acao?: ReactNode;
}

/**
 * Molde dos quatro blocos do Progresso (design D1): pergunta, leitura, e "Falar com o coach" em
 * todos — a UI descreve, quem interpreta é o coach.
 */
export function ProgressBlockCard({ pergunta, periodo, testId, children, acao }: ProgressBlockCardProps) {
  return (
    <Box data-testid={testId} sx={{ bgcolor: elevation.card, border: `1px solid ${surface[700]}`, borderRadius: radius.lg, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h6">{pergunta}</Typography>
        {periodo && <Typography variant="caption" sx={{ color: surface[500], flexShrink: 0 }}>{periodo}</Typography>}
      </Box>
      {children}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: acao ? 'space-between' : 'flex-end', gap: 1 }}>
        {acao}
        <Link component={RouterLink} to={ROUTES.ATHLETE_COACH} variant="body2" underline="hover" sx={{ color: surface[400], fontWeight: 600, py: 0.75 }}>
          Falar com o coach →
        </Link>
      </Box>
    </Box>
  );
}
