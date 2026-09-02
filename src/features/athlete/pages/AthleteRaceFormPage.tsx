import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import { glassSx, surface } from '../../../theme/tokens';
import { ROUTES } from '../../../constants/routes';
import { useAthleteRaces } from '../../../hooks/useAthleteRaces';
import { ApiError } from '../../../api/core/ApiError';
import type { CreateProvaAtleta } from '../../../types/Prova';
import { AthleteRaceForm, type AthleteRaceFormValues } from '../components/AthleteRaceForm';
import { buildAthleteRaceView, selectTargetRace } from '../adapters/raceAdapters';

/** Cadastro e edição de prova pelo atleta — página, não dialog (oito campos + mensagem da regra, D7). */
export default function AthleteRaceFormPage() {
  const navigate = useNavigate();
  const { provaId } = useParams<{ provaId?: string }>();
  const editando = Boolean(provaId);
  const { races, loading, saving, error, fetchRaces, createRace, updateRace } = useAthleteRaces();
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  useEffect(() => {
    fetchRaces();
  }, [fetchRaces]);

  const provaAtual = useMemo(() => races.find((p) => p.id === provaId), [races, provaId]);
  const alvoAtual = useMemo(() => selectTargetRace(races), [races]);
  const existingTargetName = alvoAtual && alvoAtual.id !== provaId ? alvoAtual.nome : null;

  const initial = useMemo<Partial<AthleteRaceFormValues> | undefined>(() => {
    if (!provaAtual) return undefined;
    const v = buildAthleteRaceView(provaAtual);
    return {
      nomeProva: v.nome,
      dataProva: v.dataIso,
      distancia: v.distancia,
      distanciaKm: v.distanciaKm != null ? String(v.distanciaKm) : '',
      terreno: v.terreno,
      tempoObjetivo: v.tempoObjetivo ?? '',
      provaAlvo: v.alvo,
    };
  }, [provaAtual]);

  const voltar = useCallback(() => navigate(ROUTES.ATHLETE_RACES), [navigate]);

  const salvar = useCallback(async (input: CreateProvaAtleta) => {
    setErroSalvar(null);
    try {
      if (provaId) await updateRace(provaId, input);
      else await createRace(input);
      navigate(ROUTES.ATHLETE_RACES);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErroSalvar('Esta prova já foi realizada e não pode mais ser alterada.');
      } else if (err instanceof ApiError && err.status === 400) {
        setErroSalvar('Confira a data e a distância: a prova precisa ser futura e a distância livre precisa da quilometragem.');
      } else {
        setErroSalvar('Não foi possível salvar a prova. Tente novamente.');
      }
    }
  }, [provaId, createRace, updateRace, navigate]);

  const carregando = loading && races.length === 0;
  const naoEncontrada = editando && !carregando && !error && !provaAtual;

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton aria-label="Voltar para minhas provas" onClick={voltar} sx={{ color: surface[300] }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h3">{editando ? 'Editar prova' : 'Cadastrar prova'}</Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            {editando ? 'Mudanças de data, distância ou alvo avisam seu treinador.' : 'A partir da distância, calculamos o tempo de preparação recomendado.'}
          </Typography>
        </Box>
      </Box>

      {erroSalvar && <Alert severity="error" onClose={() => setErroSalvar(null)}>{erroSalvar}</Alert>}

      {error ? (
        <Alert severity="error">Não foi possível carregar suas provas.</Alert>
      ) : carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : naoEncontrada ? (
        <Alert severity="warning">Prova não encontrada.</Alert>
      ) : (
        <Box sx={{ ...glassSx, borderRadius: 2, p: 2.5 }}>
          <AthleteRaceForm
            key={provaAtual?.id ?? 'nova'}
            initial={initial}
            existingTargetName={existingTargetName}
            submitting={saving}
            submitLabel={editando ? 'Salvar alterações' : 'Cadastrar prova'}
            onSubmit={salvar}
            onCancel={voltar}
          />
        </Box>
      )}
    </Box>
  );
}
