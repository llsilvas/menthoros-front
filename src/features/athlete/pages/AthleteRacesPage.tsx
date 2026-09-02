import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, Typography,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Flag as FlagIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { primary, semantic, surface } from '../../../theme/tokens';
import { ROUTES, athleteRaceEditRoute } from '../../../constants/routes';
import { useAthleteRaces } from '../../../hooks/useAthleteRaces';
import { buildAthleteRaceList, TERRENO_LABELS, type AthleteRaceView } from '../adapters/raceAdapters';

function RaceCard({ race, onEdit, onCancel }: { race: AthleteRaceView; onEdit: () => void; onCancel: () => void }) {
  const destaque = race.alvo && !race.realizada;
  return (
    <Box
      data-testid="race-card"
      data-alvo={race.alvo ? 'true' : 'false'}
      sx={{
        bgcolor: elevation.card,
        border: `1px solid ${destaque ? `${primary[500]}66` : surface[700]}`,
        borderRadius: radius.lg,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {destaque && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <FlagIcon sx={{ color: primary[500], fontSize: 16 }} />
          <Typography variant="caption" sx={{ color: primary[500], fontWeight: 700, letterSpacing: 0.5 }}>PROVA-ALVO</Typography>
        </Box>
      )}
      <Typography variant={destaque ? 'h6' : 'subtitle1'} sx={{ fontWeight: 700, color: surface[50] }}>{race.nome}</Typography>
      <Typography variant="body2" sx={{ color: surface[400] }}>
        {race.dataLabel} · {race.distanciaLabel} · {TERRENO_LABELS[race.terreno]}
        {race.tempoObjetivo ? ` · meta ${race.tempoObjetivo}` : ''}
      </Typography>
      {!race.realizada && (
        <Typography variant="body2" sx={{ color: destaque ? surface[100] : surface[400] }}>
          faltam {race.semanasFaltando} {race.semanasFaltando === 1 ? 'semana' : 'semanas'}
          {race.semanasMinimas != null ? ` de ${race.semanasMinimas} recomendadas` : ''}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {race.realizada ? (
          <Chip size="small" label="Realizada" sx={{ bgcolor: `${semantic.success[500]}22`, color: semantic.success[500], fontWeight: 600 }} />
        ) : (
          <Chip size="small" label="Planejada" sx={{ bgcolor: surface[700], color: surface[200] }} />
        )}
        {race.preparacaoCurta && !race.realizada && (
          <Chip size="small" label="Preparação curta" sx={{ bgcolor: `${semantic.warning[500]}22`, color: semantic.warning[500], fontWeight: 600 }} />
        )}
      </Box>
      {!race.realizada && (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button size="small" startIcon={<EditIcon />} onClick={onEdit} sx={{ color: surface[200] }}>Editar</Button>
          <Button size="small" startIcon={<CloseIcon />} onClick={onCancel} sx={{ color: semantic.danger[500] }}>Cancelar</Button>
        </Box>
      )}
    </Box>
  );
}

/** "Minhas provas" — lista com a prova-alvo em destaque; entrada pela faixa do Plano (D7). */
export default function AthleteRacesPage() {
  const navigate = useNavigate();
  const { races, loading, saving, error, fetchRaces, cancelRace } = useAthleteRaces();
  const [cancelando, setCancelando] = useState<AthleteRaceView | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  useEffect(() => {
    fetchRaces();
  }, [fetchRaces]);

  const lista = useMemo(() => buildAthleteRaceList(races), [races]);

  async function confirmarCancelamento() {
    if (!cancelando) return;
    try {
      await cancelRace(cancelando.id);
      setCancelando(null);
    } catch {
      setErroAcao('Não foi possível cancelar a prova. Tente novamente.');
    }
  }

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton aria-label="Voltar para o plano" onClick={() => navigate(ROUTES.ATHLETE_PLAN)} sx={{ color: surface[300] }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3">Minhas provas</Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>A prova-alvo orienta o plano das próximas semanas.</Typography>
        </Box>
      </Box>

      {erroAcao && <Alert severity="error" onClose={() => setErroAcao(null)}>{erroAcao}</Alert>}

      {error ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchRaces}>Tentar novamente</Button>}>
          Não foi possível carregar suas provas.
        </Alert>
      ) : loading && races.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : lista.length === 0 ? (
        <Box data-testid="races-empty" sx={{ textAlign: 'center', color: surface[400], px: 3, py: 6 }}>
          <FlagIcon sx={{ color: surface[600], fontSize: 40, mb: 1 }} />
          <Typography variant="subtitle1" sx={{ color: surface[200], mb: 1 }}>Nenhuma prova cadastrada</Typography>
          <Typography variant="body2">Cadastre sua próxima prova para o plano mirar nela.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {lista.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              onEdit={() => navigate(athleteRaceEditRoute(race.id))}
              onCancel={() => setCancelando(race)}
            />
          ))}
        </Box>
      )}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => navigate(ROUTES.ATHLETE_RACE_NEW)}
        sx={{ bgcolor: primary[500], color: surface[900], fontWeight: 700, alignSelf: 'stretch', '&:hover': { bgcolor: primary[400] } }}
      >
        Cadastrar prova
      </Button>

      <Dialog open={cancelando !== null} onClose={() => !saving && setCancelando(null)} fullWidth maxWidth="xs">
        <DialogTitle>Cancelar prova?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {cancelando?.nome} sai do seu plano e seu treinador será avisado. Você pode cadastrar de novo depois.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelando(null)} disabled={saving}>Manter</Button>
          <Button onClick={confirmarCancelamento} disabled={saving} color="error" variant="contained">Cancelar prova</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
