import { Alert, Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import { Flag as FlagIcon } from '@mui/icons-material';
import { primary, semantic, surface } from '../../../theme/tokens';
import type { CoachRaceView } from '../adapters/coachRaceAdapters';

export interface AthleteRacesPanelProps {
  races: CoachRaceView[];
  loading: boolean;
  error: Error | null;
  acting: boolean;
  onCiente: (provaId: string) => Promise<void> | void;
  onRetry: () => void;
}

const chipSx = (cor: string) => ({ bgcolor: `${cor}22`, color: cor, fontWeight: 600, height: 22 });

/**
 * Card "Provas" do perfil do coach (só leitura + "Ciente"). Lista provas futuras e canceladas
 * pendentes com chips de alvo, preparação curta e do motivo da pendência (design D8).
 */
export function AthleteRacesPanel({ races, loading, error, acting, onCiente, onRetry }: AthleteRacesPanelProps) {
  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Tentar novamente</Button>}>
        Não foi possível carregar as provas do atleta.
      </Alert>
    );
  }
  if (loading && races.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>;
  }
  if (races.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: surface[400] }}>
        Nenhuma prova futura cadastrada. O atleta cadastra pela aba Plano; o onboarding também cria a prova-alvo.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {races.map((race) => (
        <Box
          key={race.id}
          data-testid="coach-race-row"
          data-pendente={race.pendente ? 'true' : 'false'}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            p: 1.25,
            borderRadius: 1.5,
            border: `1px solid ${race.pendente ? `${semantic.warning[500]}55` : `${surface[0]}1A`}`,
            bgcolor: race.pendente ? `${semantic.warning[500]}0F` : 'transparent',
          }}
        >
          <FlagIcon sx={{ fontSize: 18, mt: '2px', color: race.alvo ? primary[500] : surface[500] }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: surface[50], textDecoration: race.cancelada ? 'line-through' : 'none' }}>
              {race.nome}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: surface[400] }}>
              {race.dataLabel} · {race.distanciaLabel}
              {race.tempoObjetivo ? ` · meta ${race.tempoObjetivo}` : ''}
              {!race.cancelada ? ` · faltam ${race.semanasFaltando}${race.semanasMinimas != null ? ` de ${race.semanasMinimas}` : ''} semanas` : ''}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {race.alvo && !race.cancelada && <Chip size="small" label="Alvo" sx={chipSx(primary[500])} />}
              {race.preparacaoCurta && !race.cancelada && <Chip size="small" label="Preparação curta" sx={chipSx(semantic.warning[500])} />}
              {race.cancelada && <Chip size="small" label="Cancelada" sx={chipSx(semantic.danger[500])} />}
              {race.pendente && <Chip size="small" label={race.pendente.label} sx={chipSx(semantic.warning[500])} />}
            </Box>
          </Box>
          {race.pendente && (
            <Button
              size="small"
              variant="outlined"
              disabled={acting}
              onClick={() => { void onCiente(race.id); }}
              sx={{ borderColor: primary[500], color: primary[500], whiteSpace: 'nowrap' }}
            >
              Ciente
            </Button>
          )}
        </Box>
      ))}
    </Box>
  );
}

export default AthleteRacesPanel;
