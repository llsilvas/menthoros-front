import { Alert, Box, Button, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { addDays, differenceInCalendarDays, format, isBefore, parseISO } from 'date-fns';
import { content, surface } from '../../../../theme/tokens';
import { KpiStrip } from '../KpiStrip';
import { SeasonMapChart } from '../SeasonMapChart';
import { SectionCard } from '../SectionCard';
import { formatKmPt, plural } from '../../adapters/format';
import type { SeasonPlan, SeasonWeek, TrainingPhase } from '../../../../types/SeasonPlan';
import type { KpiView } from '../../types/Kpi';

// PhaseIndicator não tem PEAK nem RACE_WEEK.
const PHASE_LABEL: Record<TrainingPhase, string> = {
  BASE: 'Base',
  BUILD: 'Construção',
  PEAK: 'Pico',
  TAPER: 'Polimento',
  RACE_WEEK: 'Semana da prova',
};

const CELL_SX = { fontSize: '0.8125rem', color: surface[100], borderColor: content.divider, py: 0.75 } as const;
const HEAD_SX = { ...CELL_SX, fontSize: '0.75rem', fontWeight: 700, color: surface[400] } as const;
const ACTION_BTN_SX = { minHeight: 40, textTransform: 'none' } as const;
const LIST_SX = { m: 0, pl: 2.5, display: 'grid', gap: 0.5 } as const;
const ITEM_SX = { fontSize: '0.8125rem', color: surface[100] } as const;
const EMPTY_SX = { fontSize: '0.8125rem', color: surface[300] } as const;

/** Semana que contém `hoje`; antes do início, a primeira; depois do fim, a última. */
function currentWeek(weeks: SeasonWeek[], hoje: Date): SeasonWeek | undefined {
  return weeks.find((w) => isBefore(hoje, addDays(parseISO(w.weekStart), 7))) ?? weeks[weeks.length - 1];
}

function buildKpis(plan: SeasonPlan, hoje: Date): Array<KpiView & { key: string }> {
  const kpi = (key: string, label: string, value: string, detail = ''): KpiView & { key: string } =>
    ({ key, label, value, detail, qualifier: null, tone: 'neutral', badge: null });
  const dias = differenceInCalendarDays(parseISO(plan.provaData), hoje);
  const fase = currentWeek(plan.weeks, hoje);
  return [
    kpi('weeks', 'Semanas', String(plan.totalWeeks), plan.shortPreparation ? 'Preparação curta' : ''),
    kpi('days', 'Dias até a prova', String(Math.max(dias, 0)), format(parseISO(plan.provaData), 'dd/MM/yyyy')),
    kpi('phase', 'Fase atual', fase ? PHASE_LABEL[fase.phase] : '—', fase ? `Semana ${fase.weekIndex}` : ''),
    kpi('peak', 'Volume de pico', `${formatKmPt(plan.peakVolumeKm)} km`),
  ];
}

interface SeasonTabPanelProps {
  plan: SeasonPlan | null;
  loading: boolean;
  generating: boolean;
  /** A leitura falhou: não se sabe se há temporada, então não se oferece gerar. */
  loadError: Error | null;
  generateError: Error | null;
  /** Atleta tem prova-alvo não cancelada (do perfil). */
  hasTargetRace: boolean;
  onGenerate: () => void;
  onRetry: () => void;
  hoje?: Date;
}

export function SeasonTabPanel({ plan, loading, generating, loadError, generateError, hasTargetRace, onGenerate, onRetry, hoje = new Date() }: SeasonTabPanelProps) {
  if (loading) {
    return (
      <Box data-testid="season-loading" role="status" aria-label="Carregando temporada">
        <Skeleton variant="rounded" height={64} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={200} />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" onClick={onRetry} sx={ACTION_BTN_SX}>
            Tentar de novo
          </Button>
        }
      >
        {loadError.message}
      </Alert>
    );
  }

  if (!plan) {
    return (
      <SectionCard title="Temporada">
        {generateError ? <Alert severity="error" sx={{ mb: 1 }}>{generateError.message}</Alert> : null}
        {hasTargetRace ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8125rem', color: surface[200] }}>
              Este atleta tem prova-alvo e ainda não tem temporada.
            </Typography>
            <Button variant="contained" onClick={onGenerate} disabled={generating} sx={ACTION_BTN_SX}>
              {generating ? 'Gerando…' : 'Gerar temporada'}
            </Button>
          </Box>
        ) : (
          <Typography sx={{ fontSize: '0.8125rem', color: surface[200] }}>
            Sem prova-alvo. Marque uma prova como alvo para gerar a temporada.
          </Typography>
        )}
      </SectionCard>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      {plan.seasonStatus === 'PROPOSED' ? (
        <Alert severity="info">
          Proposta de temporada até {plan.provaNome}. Ainda não foi aprovada.
        </Alert>
      ) : null}
      <KpiStrip items={buildKpis(plan, hoje)} testIdPrefix="season-kpi" />
      <SectionCard title="Mapa da temporada">
        <SeasonMapChart
          weeks={plan.weeks}
          milestones={plan.milestones}
          peakVolumeKm={plan.peakVolumeKm}
          currentWeekIndex={currentWeek(plan.weeks, hoje)?.weekIndex}
        />
      </SectionCard>
      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <SectionCard title="Marcos">
          {plan.milestones.length ? (
            <Box component="ul" aria-label="Marcos" sx={LIST_SX}>
              {plan.milestones.map((m) => (
                <Box component="li" key={m.provaId} sx={ITEM_SX}>
                  {`${m.name} · Semana ${m.weekIndex} · ${format(parseISO(m.date), 'dd/MM')}`}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={EMPTY_SX}>Sem provas preparatórias na janela.</Typography>
          )}
        </SectionCard>
        <SectionCard title="Validações">
          {plan.validations.length ? (
            <Box component="ul" aria-label="Validações" sx={LIST_SX}>
              {plan.validations.map((v) => (
                <Box component="li" key={`${v.rule}-${v.weekIndex}`} sx={ITEM_SX}>
                  {`Semana ${v.weekIndex}: ${v.message}`}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={EMPTY_SX}>Proposta dentro dos limites.</Typography>
          )}
        </SectionCard>
      </Box>
      <SectionCard title={`Semanas · ${plural(plan.totalWeeks, 'semana', 'semanas')}`}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Semanas da temporada">
            <TableHead>
              <TableRow>
                <TableCell sx={HEAD_SX}>Semana</TableCell>
                <TableCell sx={HEAD_SX}>Início</TableCell>
                <TableCell sx={HEAD_SX}>Fase</TableCell>
                <TableCell sx={HEAD_SX} align="right">Volume</TableCell>
                <TableCell sx={HEAD_SX} align="right">Longão</TableCell>
                <TableCell sx={HEAD_SX} align="right">TSS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.weeks.map((w) => (
                <TableRow key={w.weekIndex}>
                  <TableCell sx={CELL_SX}>{w.weekIndex}</TableCell>
                  <TableCell sx={CELL_SX}>{format(parseISO(w.weekStart), 'dd/MM')}</TableCell>
                  <TableCell sx={CELL_SX}>
                    {`${PHASE_LABEL[w.phase] ?? w.phase}${w.deload ? ' · descarga' : ''}`}
                  </TableCell>
                  <TableCell sx={CELL_SX} align="right">{`${formatKmPt(w.targetVolumeKm)} km`}</TableCell>
                  <TableCell sx={CELL_SX} align="right">
                    {w.longRunKm == null ? '—' : `${formatKmPt(w.longRunKm)} km`}
                  </TableCell>
                  <TableCell sx={CELL_SX} align="right">{Math.round(w.targetTss)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>
    </Box>
  );
}
