import { lazy, Suspense, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ExpandMore as ExpandIcon } from '@mui/icons-material';
import { surface, semantic } from '../../../../theme/tokens';
import { elevation } from '../../../../shared/design-tokens';
import { radius } from '../../../../shared/design-tokens/density';
import type { StrongerReading } from '../../adapters/buildProgressReadings';
import type { PMCDataPoint } from '../PMCChart';
import { ProgressBlockCard } from './ProgressBlockCard';
import { Sparkline } from './Sparkline';

const PMCChart = lazy(() => import('../PMCChart').then((m) => ({ default: m.PMCChart })));

export interface StrongerBlockProps {
  reading: StrongerReading;
  pmcData: PMCDataPoint[];
}

const TOM: Record<'success' | 'warning' | 'danger' | 'neutral', string> = {
  success: semantic.success[500], warning: semantic.warning[500], danger: semantic.danger[500], neutral: surface[300],
};

function leitura(r: StrongerReading): { titulo: string; destaque?: string; destaqueCor: string } {
  if (r.delta === null) return { titulo: 'Ainda cedo para comparar', destaqueCor: surface[300] };
  const n = Math.abs(r.delta);
  if (r.tendencia === 'estavel') return { titulo: 'Sua carga ficou estável', destaqueCor: surface[300] };
  if (r.tendencia === 'subiu') return { titulo: 'Sua carga subiu', destaque: `+${n}`, destaqueCor: semantic.success[500] };
  return { titulo: 'Sua carga caiu', destaque: `−${n}`, destaqueCor: semantic.warning[500] };
}

/** Bloco 1: "Estou ficando mais forte?" — descreve a variação do CTL; não julga (design D1/D2). */
export function StrongerBlock({ reading, pmcData }: StrongerBlockProps) {
  const [expandido, setExpandido] = useState(false);
  const l = leitura(reading);

  return (
    <ProgressBlockCard
      pergunta="Estou ficando mais forte?"
      periodo="12 semanas"
      testId="progress-stronger"
      acao={(
        <Button size="small" onClick={() => setExpandido((v) => !v)} aria-expanded={expandido} endIcon={<ExpandIcon sx={{ transform: expandido ? 'rotate(180deg)' : 'none' }} />} sx={{ minHeight: 44, px: 0 }}>
          {expandido ? 'Fechar o gráfico' : 'Ver o gráfico completo'}
        </Button>
      )}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="h4" data-testid="progress-stronger-reading">
          {l.titulo}{l.destaque && <> <Box component="span" sx={{ color: l.destaqueCor }}>{l.destaque}</Box></>}
        </Typography>
        <Typography variant="body2" sx={{ color: surface[400] }}>
          {reading.delta === null
            ? 'Precisa de pelo menos 4 semanas de treinos registrados para comparar.'
            : 'nas últimas 4 semanas — o que isso significa é conversa com o coach'}
        </Typography>
      </Box>

      <Sparkline valores={reading.sparkline} labelInicio="12 sem atrás" labelFim="hoje" />

      {reading.forma && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, bgcolor: elevation.panel, borderRadius: radius.md, px: 1.5, py: 1.25 }}>
          <Typography variant="caption" sx={{ color: surface[500], letterSpacing: '0.04em', textTransform: 'uppercase' }}>Forma hoje</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: TOM[reading.forma.tone] }}>{reading.forma.label}</Typography>
          <Typography variant="caption" sx={{ color: surface[500], marginLeft: 'auto' }}>classificação do sistema</Typography>
        </Box>
      )}

      {expandido && (
        <Box data-testid="progress-pmc-expanded">
          <Suspense fallback={<Typography variant="body2" sx={{ color: surface[400] }}>Carregando gráfico…</Typography>}>
            <PMCChart data={pmcData} range="12w" />
          </Suspense>
        </Box>
      )}
    </ProgressBlockCard>
  );
}
