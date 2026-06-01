import { useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { TodayHeroCard } from '../components/TodayHeroCard';
import { ReadinessCard } from '../components/ReadinessCard';
import { QuickCheckInModal } from '../components/QuickCheckInModal';
import type { QuickCheckInData } from '../components/QuickCheckInModal';
import { glassSx, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TODAY = {
  athleteName: 'Carlos',
  workoutType: 'easy_run' as const,
  timeOfDay: 'morning' as const,
  motivationalMessage: 'Consistência é o segredo. Hoje é mais um dia de construir sua base.',
  nextWorkout: {
    title: 'Corrida Fácil',
    description: 'Ritmo confortável, conversa possível',
    estimatedDuration: 60,
  },
  readiness: {
    score: 78,
    factors: { recovery: 82, fatigue: 35, sleep: 75 },
    trend: 'stable' as const,
    recommendation: 'Boa prontidão para o treino de hoje. Mantenha hidratação.',
  },
  metrics: [
    { label: 'Carga de treino',  value: '62', unit: 'TSS', tooltip: 'Training Stress Score — quanto esse treino custou para seu corpo.' },
    { label: 'Condicionamento', value: '74', unit: 'pts', tooltip: 'CTL (Chronic Training Load) — sua forma física dos últimos 42 dias.' },
    { label: 'Forma',           value: '+3', unit: 'pts', tooltip: 'TSB — equilíbrio entre carga e recuperação. Positivo = fresco.' },
    { label: 'Cansaço',        value: '71', unit: 'pts', tooltip: 'ATL (Acute Training Load) — fadiga acumulada dos últimos 7 dias.' },
  ],
};

// ── MetricCard (local, não exportado) ────────────────────────────────────────

interface MetricCardData {
  label: string;
  value: string;
  unit: string;
  tooltip: string;
}

function MetricCard({ label, value, unit, tooltip }: MetricCardData) {
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Box
        sx={{
          ...glassSx,
          borderRadius: 2,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          cursor: 'default',
        }}
      >
        <Typography
          sx={{
            color: surface[400],
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography
            sx={{
              color: surface[50],
              fontSize: '1.75rem',
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          <Typography
            sx={{
              color: surface[500],
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {unit}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

// ── AthleteHomePage ───────────────────────────────────────────────────────────

export default function AthleteHomePage() {
  const [checkInOpen, setCheckInOpen] = useState(false);

  function handleCheckInSubmit(data: QuickCheckInData) {
    // TODO: enviar ao backend quando endpoint estiver disponível
    console.log('QuickCheckIn submitted:', data);
    setCheckInOpen(false);
  }

  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: elevation.base,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {/* TodayHeroCard */}
      <TodayHeroCard
        athleteName={MOCK_TODAY.athleteName}
        workoutType={MOCK_TODAY.workoutType}
        timeOfDay={MOCK_TODAY.timeOfDay}
        motivationalMessage={MOCK_TODAY.motivationalMessage}
        nextWorkout={MOCK_TODAY.nextWorkout}
        primaryActionLabel="Iniciar treino"
        onPrimaryAction={() => setCheckInOpen(true)}
      />

      {/* ReadinessCard */}
      <ReadinessCard
        score={MOCK_TODAY.readiness.score}
        factors={MOCK_TODAY.readiness.factors}
        trend={MOCK_TODAY.readiness.trend}
        recommendation={MOCK_TODAY.readiness.recommendation}
      />

      {/* Métricas de hoje */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography
          sx={{
            color: surface[50],
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Métricas de hoje
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1.5,
          }}
        >
          {MOCK_TODAY.metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              tooltip={metric.tooltip}
            />
          ))}
        </Box>
      </Box>

      {/* QuickCheckInModal — fora do fluxo de scroll */}
      <QuickCheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSubmit={handleCheckInSubmit}
      />
    </Box>
  );
}
