import { memo } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { AttentionInfo, LinhaContexto } from '../adapters/coachInboxAdapters';
import { activeTheme } from '../../../theme/activeTheme';
import { primary, semantic, surface } from '../../../theme/tokens';

export interface AttentionOnlyRowProps {
  atletaId: string;
  athleteName: string;
  attention: AttentionInfo;
  contexto: LinhaContexto;
  selected: boolean;
  onClick: () => void;
}

/**
 * Linha de um atleta que veio **só** da fila de atenção — não está na página corrente do roster.
 *
 * Mesma linha de ~46px da `QueueRow`, mas sem métricas: o DTO da fila não traz aderência, e
 * preenchê-la com zero exibiria ausência como medição. O "—" diz isso; o `title` diz por quê.
 */
export const AttentionOnlyRow = memo(function AttentionOnlyRow({
  athleteName,
  attention,
  contexto,
  selected,
  onClick,
}: AttentionOnlyRowProps) {
  const cor = attention.severity === 'MEDIA' ? semantic.warning[500] : semantic.danger[500];

  return (
    <ButtonBase
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      title="Fora da página atual da lista — abra para ver o detalhe completo."
      sx={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        py: 0.875,
        borderRadius: 1.5,
        border: `1px solid ${selected ? primary[500] : `${cor}66`}`,
        backgroundColor: selected ? `${primary[500]}14` : `${cor}0F`,
        '&:hover': { borderColor: primary[500] },
      }}
    >
      <WarningAmberIcon sx={{ fontSize: '1.1rem', color: cor, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: surface[50], lineHeight: 1.15 }} noWrap>
          {athleteName}
        </Typography>
        <Typography data-testid="queue-row-motivo" sx={{ fontSize: '0.6875rem', lineHeight: 1.3, color: cor, fontWeight: 600 }} noWrap>
          {contexto.texto}
        </Typography>
      </Box>
      <Typography
        data-testid="queue-row-aderencia"
        aria-label="Aderência sem dado"
        sx={{ flex: 'none', fontFamily: activeTheme.font.mono, fontSize: '0.75rem', fontWeight: 600, color: surface[500] }}
      >
        —
      </Typography>
    </ButtonBase>
  );
});

export default AttentionOnlyRow;
