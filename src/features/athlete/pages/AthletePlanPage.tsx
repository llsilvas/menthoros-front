import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { WeekAgenda } from '../components/WeekAgenda';
import { WorkoutDetailDrawer } from '../components/WorkoutDetailDrawer';
import { buildWeekAgenda, type AgendaDay } from '../adapters/buildWeekAgenda';
import { useAthletePlan } from '../../../hooks/useAthletePlan';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';
import { RaceTargetBanner } from '../components/RaceTargetBanner';
import { ROUTES } from '../../../constants/routes';
import { formatKm } from '../../../utils/formatKm';

function periodo(dias: AgendaDay[]): string {
  return `${format(dias[0].date, 'd', { locale: ptBR })} – ${format(dias[6].date, "d 'de' MMM", { locale: ptBR })}`;
}

export default function AthletePlanPage() {
  const navigate = useNavigate();
  const { plano, loading, error, fetchPlano } = useAthletePlan();
  const { provas, loading: provasLoading, error: provasError, fetchProvas } = useAthleteProvas();
  const [expandedIso, setExpandedIso] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<AgendaDay | null>(null);

  useEffect(() => {
    fetchPlano();
    fetchProvas();
  }, [fetchPlano, fetchProvas]);

  const agenda = useMemo(() => (plano ? buildWeekAgenda(plano) : null), [plano]);

  // Hoje começa expandido quando o plano contém hoje (D2); o usuário pode fechar.
  useEffect(() => {
    if (agenda?.contemHoje) setExpandedIso(agenda.dias.find((d) => d.isToday)?.iso ?? null);
    else setExpandedIso(null);
  }, [agenda]);

  const registrar = () => navigate(ROUTES.ATHLETE_TRAINING_LOG);

  const pct = agenda && plano && plano.volumePlanejadoKm > 0 ? Math.min(100, (plano.volumeRealizadoKm / plano.volumePlanejadoKm) * 100) : 0;
  const esperadoPct = agenda?.diaDaSemana ? (agenda.diaDaSemana / 7) * 100 : null;

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="h3">Plano da semana</Typography>
        <Typography variant="body2" sx={{ color: surface[400] }}>
          {agenda
            ? [agenda.contemHoje ? periodo(agenda.dias) : `Semana de ${periodo(agenda.dias)}`, plano?.objetivoSemanal].filter(Boolean).join(' · ')
            : 'Treinos aprovados pelo seu coach'}
        </Typography>
      </Box>

      {/* Faixa da prova-alvo: a entrada para "Minhas provas" (sem item no menu, D7). Independe do plano. */}
      <RaceTargetBanner provas={provas} loading={provasLoading} error={provasError} />

      {error ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchPlano}>Tentar novamente</Button>}>
          Não foi possível carregar seu plano da semana.
        </Alert>
      ) : loading && !plano ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : !plano || !agenda ? (
        <Box sx={{ textAlign: 'center', color: surface[400], px: 3, py: 8 }}>
          <Typography variant="subtitle1" sx={{ color: surface[200], mb: 1 }}>
            Seu coach ainda não aprovou o plano desta semana
          </Typography>
          <Typography variant="body2">
            Assim que o plano for aprovado, ele aparece aqui com os treinos da semana.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Volume neutro (D3): sem juízo — a leitura qualitativa é do coach */}
          <Box data-testid="plan-volume" sx={{ bgcolor: elevation.card, border: `1px solid ${surface[700]}`, borderRadius: radius.lg, px: 2, py: 1.75, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: surface[400] }}>Volume da semana</Typography>
              <Typography variant="body1" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                <Box component="strong" sx={{ fontWeight: 600 }}>{formatKm(plano.volumeRealizadoKm)}</Box>
                <Box component="span" sx={{ color: surface[500] }}> / {plano.volumePlanejadoKm} km</Box>
              </Typography>
            </Box>
            <Box sx={{ position: 'relative', height: 6, borderRadius: 3, bgcolor: surface[700], overflow: 'visible' }}>
              <Box sx={{ width: `${pct}%`, height: 6, borderRadius: 3, bgcolor: primary[500] }} />
              {esperadoPct !== null && (
                // `width: 1` no sx do MUI é 100% (escala de tema), não 1px — a versão anterior desenhava uma
                // barra da largura da trilha a partir do marcador, estourando a tela. Unidades explícitas.
                <Box data-testid="plan-volume-marker" aria-hidden sx={{ position: 'absolute', left: `${esperadoPct}%`, top: '-2px', width: '1px', height: '10px', bgcolor: surface[500] }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: surface[500] }}>
                {agenda.diaDaSemana ? `Dia ${agenda.diaDaSemana} de 7` : 'Semana ainda não começou'}
              </Typography>
              <Typography variant="caption" sx={{ color: surface[500] }}>
                {agenda.treinosFeitos} de {agenda.treinosPlanejados} treinos feitos
              </Typography>
            </Box>
          </Box>

          <WeekAgenda
            agenda={agenda}
            expandedIso={expandedIso}
            onToggle={(iso) => setExpandedIso((atual) => (atual === iso ? null : iso))}
            onOpenDetail={setDetalhe}
            onRegister={registrar}
          />

          <WorkoutDetailDrawer dia={detalhe} onClose={() => setDetalhe(null)} onRegister={registrar} />
        </>
      )}
    </Box>
  );
}
