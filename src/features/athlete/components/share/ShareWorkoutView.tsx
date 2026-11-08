import { Typography } from '@mui/material';
import type { ShareCardData } from '../../types/ShareCard';

export interface ShareWorkoutViewProps {
  data: ShareCardData;
}

/**
 * Conteúdo da tela de compartilhar com os dados prontos. Seção 1 só expõe os modelos disponíveis;
 * prévia, controles e destinos chegam nas seções 2–4 de athlete-share-cards.
 */
export function ShareWorkoutView({ data }: ShareWorkoutViewProps) {
  return (
    <Typography variant="body2" color="text.secondary" data-testid="share-models">
      {data.availableModels.length} modelo(s) disponível(is)
    </Typography>
  );
}
