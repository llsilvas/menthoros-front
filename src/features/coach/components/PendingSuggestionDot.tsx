import { Box } from '@mui/material';
import { backgrounds, semantic } from '../../../theme/tokens';

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
        // Mesmo laranja do status "Atenção": sugestão pendente pede ação do coach. O lime de marca
        // sumia sobre o avatar escuro; o anel na cor do fundo separa o ponto da borda do que ele
        // marca (avatar no roster, chip no calendário).
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: semantic.warning[500],
        boxShadow: `0 0 0 1.5px ${backgrounds.card}`,
        flexShrink: 0,
      }}
    />
  );
}

export default PendingSuggestionDot;
