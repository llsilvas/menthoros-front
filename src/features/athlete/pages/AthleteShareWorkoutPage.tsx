import { useEffect } from 'react';
import { Alert, Box, Button, Skeleton, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router';
import { ROUTES } from '../../../constants/routes';
import { useShareWorkout } from '../hooks/useShareWorkout';
import { ShareWorkoutView } from '../components/share/ShareWorkoutView';

/** Compartilhar um treino realizado como imagem (athlete-share-cards). */
export default function AthleteShareWorkoutPage() {
  const { treinoId } = useParams();
  const { data, loading, error, notFound, fetchData } = useShareWorkout(treinoId);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 4 }}>
      <Typography component="h1" variant="h6" sx={{ fontWeight: 600 }}>
        Compartilhar treino
      </Typography>

      {error ? (
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={() => void fetchData()}>Tentar de novo</Button>}
        >
          Não deu para carregar o treino.
        </Alert>
      ) : notFound ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
          <Typography>Treino não encontrado.</Typography>
          <Button component={RouterLink} to={ROUTES.ATHLETE_HOME} variant="outlined">
            Voltar ao início
          </Button>
        </Box>
      ) : loading || !data ? (
        <Box aria-busy="true" aria-label="Carregando o treino" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Skeleton variant="rounded" height={320} />
          <Skeleton variant="rounded" height={44} />
          <Skeleton variant="rounded" height={44} />
        </Box>
      ) : (
        <ShareWorkoutView data={data} />
      )}
    </Box>
  );
}
