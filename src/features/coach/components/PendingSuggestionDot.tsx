import { Box } from '@mui/material';
import { primary } from '../../../theme/tokens';

interface PendingSuggestionDotProps {
  /** Posição absoluta em px a partir do topo do container relativo pai (padrão: 2). */
  top?: number;
  /** Posição absoluta em px a partir da direita do container relativo pai (padrão: 2). */
  right?: number;
}

/**
 * Ponto que sinaliza uma `SugestaoCoach` PENDING não-expirada (add-pending-suggestion-badge).
 * Compartilhado entre `AthleteNameCell` (roster) e `CoachCalendarPage` (calendário semanal) para
 * garantir a mesma convenção visual e o mesmo nome acessível nos dois lugares — extraído após
 * QA apontar que a cópia inicial já tinha divergido (offset e nome acessível diferentes).
 */
export function PendingSuggestionDot({ top = 2, right = 2 }: PendingSuggestionDotProps) {
  return (
    <Box
      role="img"
      aria-label="Sugestão pendente"
      sx={{
        position: 'absolute',
        top,
        right,
        width: 5,
        height: 5,
        borderRadius: '50%',
        backgroundColor: primary[500],
        flexShrink: 0,
      }}
    />
  );
}

export default PendingSuggestionDot;
