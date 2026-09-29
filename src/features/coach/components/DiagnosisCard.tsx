import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { elevation } from '../../../shared/design-tokens';
import { content, surface } from '../../../theme/tokens';

interface DiagnosisCardProps {
  title: string;
  /** Diz o que o conteúdo mostra (num gráfico, também a unidade) — o título sozinho não diz. */
  subtitle?: string;
  /** Controles ou legenda, alinhados à direita do título. */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Card da aba Diagnóstico (padrão da Proposta). Diferente do `SectionCard`: título em caixa normal
 * com subtítulo explicativo e a ação na mesma linha, sem barra de cabeçalho — o cabeçalho diz o
 * que o conteúdo mostra, em vez de só nomeá-lo.
 */
export function DiagnosisCard({ title, subtitle, action, children }: DiagnosisCardProps) {
  return (
    <Box
      component="section"
      aria-label={title}
      sx={{
        border: `1px solid ${content.cardBorder}`,
        borderRadius: 2,
        backgroundColor: elevation.card,
        px: { xs: 1.5, xl: 2.25 },
        pt: { xs: 1.5, xl: 2.25 },
        pb: { xs: 1, xl: 1.25 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        minWidth: 0,
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h3" sx={{ fontSize: { xs: '1rem', xl: '1.05rem' }, fontWeight: 600, color: surface[50], lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ fontSize: '0.75rem', color: surface[400], mt: 0.25, lineHeight: 1.4, textWrap: 'pretty' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>{action}</Box> : null}
      </Box>
      {children}
    </Box>
  );
}
