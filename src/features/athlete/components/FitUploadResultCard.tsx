import { Box, Button, Typography } from '@mui/material';
import { surface, primary } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { buildFitUploadPreview } from '../adapters/fitUploadResultAdapter';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';

export interface FitUploadResultCardProps {
  treino: TreinoRealizadoDto;
  onImportarOutro: () => void;
  onVoltar: () => void;
}

export function FitUploadResultCard({ treino, onImportarOutro, onVoltar }: FitUploadResultCardProps) {
  const { duracaoLabel, distanciaLabel, fcLabel, lapsLabel } = buildFitUploadPreview(treino);

  return (
    <Box
      sx={{
        bgcolor: elevation.card,
        borderRadius: 1,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h6" sx={{ color: surface[50] }}>
        Treino importado com sucesso
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {duracaoLabel && (
          <Typography sx={{ color: surface[200], fontSize: '0.9rem', fontWeight: 600 }}>{duracaoLabel}</Typography>
        )}
        {distanciaLabel && (
          <Typography sx={{ color: surface[200], fontSize: '0.9rem', fontWeight: 600 }}>{distanciaLabel}</Typography>
        )}
        {fcLabel && (
          <Typography sx={{ color: surface[200], fontSize: '0.9rem', fontWeight: 600 }}>{fcLabel}</Typography>
        )}
        {lapsLabel && (
          <Typography sx={{ color: surface[200], fontSize: '0.9rem', fontWeight: 600 }}>{lapsLabel}</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={onImportarOutro}
          sx={{ bgcolor: primary[500], color: elevation.base, fontWeight: 700, '&:hover': { bgcolor: primary[400] } }}
        >
          Importar outro
        </Button>
        <Button
          variant="outlined"
          onClick={onVoltar}
          sx={{ color: surface[400], borderColor: surface[600] }}
        >
          Voltar para Home
        </Button>
      </Box>
    </Box>
  );
}

export default FitUploadResultCard;
