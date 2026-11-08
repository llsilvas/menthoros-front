import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { semantic, surface } from '../../../theme/tokens';
import { marcadorDe } from './toneMarker';
import type { KpiView } from '../types/Kpi';
import { toneColor } from '../../../theme/toneColor';

/** Só para leitor de tela (mesmo padrão do `visuallyHidden` do MUI, sem depender de `@mui/utils`). */
// Valores em px por extenso: no `sx`, `width: 1` vira 100% e `margin: -1` vira spacing.
const SO_LEITOR_DE_TELA = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

interface KpiCellProps {
  kpi: KpiView;
  testId: string;
  sx?: SxProps<Theme>;
  /** Ícone ao lado do rótulo — identifica a métrica; o estado continua no tom do valor. */
  icon?: ReactNode;
  /**
   * Rótulo e valor na mesma linha (~34px). A linha de apoio sai da tela: vai para `title` e para
   * um texto só de leitor de tela. Para faixas que o coach lê de relance, não para evidência.
   */
  dense?: boolean;
}

/**
 * Célula de KPI: rótulo · qualificador, valor com marcador de tom, selo opcional e linha de apoio
 * em até 2 linhas. A linha de apoio carrega a base do número ou o motivo de não haver um — texto
 * que o tile compacto, de uma linha, cortava.
 */
export function KpiCell({ kpi, testId, sx, icon, dense = false }: KpiCellProps) {
  const color = toneColor(kpi.tone);
  const marcador = marcadorDe(kpi.tone);
  return (
    <Box
      data-testid={testId}
      // `detail` vazio = sem linha de apoio (célula sem dado): nem title, nem texto oculto.
      title={dense && kpi.detail ? kpi.detail : undefined}
      sx={[
        // Densa: rótulo e valor na mesma linha; em célula estreita (1024px, quatro colunas) o valor
        // desce para a linha de baixo em vez de vazar ou cortar ("Acumulando fadiga" não cabe).
        dense
          ? { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', columnGap: 1, rowGap: 0.25, minWidth: 0 }
          : { display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography
        sx={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: surface[400], display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}
      >
        {icon ? (
          <Box component="span" data-testid="kpi-icon" aria-hidden sx={{ display: 'inline-flex', '& svg': { fontSize: '1.15rem' } }}>
            {icon}
          </Box>
        ) : null}
        <span>
          {kpi.label}
          {kpi.qualifier ? <Box component="span" sx={{ color: surface[500] }}> · {kpi.qualifier}</Box> : null}
        </span>
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, minWidth: 0 }}>
        <Typography
          sx={{
            // Denso em 14px: 'Acumulando fadiga' cabe numa linha na célula de 1366px (~158px úteis).
            fontSize: dense ? '0.875rem' : { xs: '1.25rem', xl: '1.5rem' },
            fontWeight: 700,
            lineHeight: 1.15,
            color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {marcador ? <marcador.Icone titleAccess={marcador.rotulo} sx={{ fontSize: '0.85em', mr: 0.5, verticalAlign: '-0.1em', color }} /> : null}
          {kpi.value}
        </Typography>
        {kpi.badge ? (
          <Box
            component="span"
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: semantic.warning[500],
              border: `1px dashed ${semantic.warning[700]}`,
              borderRadius: 999,
              px: 1,
              py: 0.15,
              whiteSpace: 'nowrap',
            }}
          >
            {kpi.badge}
          </Box>
        ) : null}
      </Box>
      {!kpi.detail ? null : dense ? (
        // Tamanho explícito: texto oculto também conta como texto da página para o mínimo de 11px.
        <Box component="span" sx={{ ...SO_LEITOR_DE_TELA, fontSize: '0.6875rem' }}>
          {kpi.detail}
        </Box>
      ) : (
        <Typography
          sx={{
            fontSize: '0.75rem',
            lineHeight: 1.35,
            color: surface[400],
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textWrap: 'pretty',
          }}
        >
          {kpi.detail}
        </Typography>
      )}
    </Box>
  );
}
