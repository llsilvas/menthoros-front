import { Box, Typography } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { content, surface } from '../../../theme/tokens';

export interface EmptyMetricStateProps {
  /** O que falta, em uma frase — sem jargão de sistema ("payload vazio", "sem PMC"). */
  mensagem: string;
  /** O que destrava a informação. Omitir quando não houver ação do coach. */
  proximoPasso?: string;
}

/**
 * Estado de "sem dado na janela" para blocos de métrica.
 *
 * Existe porque a alternativa é pior: os adapters preenchem métricas ausentes com fallback numérico
 * (0 km de carga, monotonia 1.00), e esses valores caem em faixas "adequadas". O coach lia uma
 * grade verde para um atleta que nunca sincronizou um treino — zero por ausência de dado exibido
 * como zero medido.
 */
export function EmptyMetricState({ mensagem, proximoPasso }: EmptyMetricStateProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: `1px dashed ${content.cardBorder}`,
        backgroundColor: `${surface[0]}06`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
      }}
    >
      <InsightsIcon sx={{ fontSize: '1.1rem', color: surface[500], mt: '2px' }} />
      <Box>
        <Typography sx={{ fontSize: '0.875rem', color: surface[200], lineHeight: 1.4 }}>
          {mensagem}
        </Typography>
        {proximoPasso ? (
          <Typography sx={{ fontSize: '0.75rem', color: surface[400], mt: 0.5 }}>
            {proximoPasso}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export default EmptyMetricState;
