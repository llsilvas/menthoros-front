import { memo } from 'react';
import { Box, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { AttentionInfo } from '../adapters/coachInboxAdapters';
import { content, semantic, surface } from '../../../theme/tokens';

const REASON_LABEL: Record<AttentionInfo['reason'], string> = {
  FADIGA: 'Fadiga',
  SOBRECARGA: 'Sobrecarga',
  SEM_PLANO: 'Sem plano',
  ADERENCIA: 'Aderência',
  INATIVIDADE: 'Inatividade',
  ZONAS_VENCIDAS: 'Zonas vencidas',
};

export interface AttentionOnlyRowProps {
  atletaId: string;
  athleteName: string;
  attention: AttentionInfo;
  selected: boolean;
  onClick: () => void;
}

/**
 * Linha de um atleta que veio **só** da fila de atenção — não está na página corrente do roster.
 *
 * Renderiza deliberadamente menos que a `QueueRow`: o DTO da fila de atenção traz nome, severidade,
 * motivo e ação sugerida, e **nenhuma** das métricas (aderência, volume, forma). Preencher esses
 * campos com zero para manter o mesmo desenho exibiria ausência de dado como se fosse medição —
 * um "0% de aderência" que o coach leria como fato.
 */
export const AttentionOnlyRow = memo(function AttentionOnlyRow({
  athleteName,
  attention,
  selected,
  onClick,
}: AttentionOnlyRowProps) {
  const critico = attention.severity === 'CRITICA' || attention.severity === 'ALTA';
  const cor = critico ? semantic.danger[500] : semantic.warning[500];

  return (
    <Box
      component="button"
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      sx={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        p: 1.25,
        borderRadius: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        bgcolor: selected ? `${cor}1F` : `${cor}14`,
        border: `1px solid ${selected ? cor : `${cor}55`}`,
        '&:hover': { bgcolor: `${cor}1F` },
      }}
    >
      <WarningAmberIcon sx={{ fontSize: '1rem', color: cor, mt: '2px', flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: surface[50] }}>
          {athleteName}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: cor, fontWeight: 600 }}>
          {REASON_LABEL[attention.reason]}
          {attention.recencyDays != null ? ` · ${attention.recencyDays}d` : ''}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: surface[400] }}>
          {attention.suggestedAction}
        </Typography>
        {/* Diz o que a linha NÃO tem. Sem isso, a ausência das métricas parece bug de carregamento. */}
        <Typography sx={{ fontSize: '0.6875rem', color: surface[500], borderTop: `1px dashed ${content.divider}`, mt: 0.5, pt: 0.5 }}>
          Fora da página atual da lista — abra para ver o detalhe completo.
        </Typography>
      </Box>
    </Box>
  );
});

export default AttentionOnlyRow;
