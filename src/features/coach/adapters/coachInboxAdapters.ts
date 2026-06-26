import { formatWorkoutTypeLabel, statusLabel } from '../components/coachInboxHelpers';
import type { CoachAtletaResumo, CoachAtletaStatus } from '../../../types/Coach';
import type { AtletaPerfilCoachDto, PmcPontoRaw } from '../../../types/AtletaPerfilCoach';
import type { Prova } from '../../../types/Prova';
import type { CoachAthleteRow, RaceItem, SegmentFilter } from '../types/CoachInbox';

export function calcularMonotonia(pmcPoints: PmcPontoRaw[]): number {
  const ultimos7 = pmcPoints.slice(-7).map((p) => p.tss ?? 0).filter((v) => v > 0);
  if (ultimos7.length < 3) return 1.0;
  const media = ultimos7.reduce((a, b) => a + b, 0) / ultimos7.length;
  const variancia = ultimos7.reduce((a, b) => a + (b - media) ** 2, 0) / ultimos7.length;
  const stddev = Math.sqrt(variancia);
  return stddev === 0 ? 1.0 : parseFloat((media / stddev).toFixed(2));
}

export function calcularLoadDelta(pmcPoints: PmcPontoRaw[]): number {
  if (pmcPoints.length < 8) return 0;
  const ctlAtual = pmcPoints[pmcPoints.length - 1]?.ctl ?? 0;
  const ctlSemanaPassada = pmcPoints[pmcPoints.length - 8]?.ctl ?? 0;
  if (ctlSemanaPassada === 0) return 0;
  return parseFloat(((ctlAtual - ctlSemanaPassada) / ctlSemanaPassada * 100).toFixed(1));
}

export function calcularAcwr(atl: number | null, ctl: number | null): number | null {
  if (atl == null || ctl == null || ctl === 0) return null;
  return parseFloat((atl / ctl).toFixed(2));
}

function formatDuration(iso: string | undefined): string {
  if (!iso) return '—';
  const h = parseInt(iso.match(/(\d+)H/)?.[1] ?? '0', 10);
  const m = parseInt(iso.match(/(\d+)M/)?.[1] ?? '0', 10);
  if (h === 0 && m === 0) return '—';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatRaceDate(dateIso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date(`${dateIso}T12:00:00`))
    .replace('.', '');
}

export function buildRaceCalendarFromProfile(profile: AtletaPerfilCoachDto | null): RaceItem[] {
  const provas = profile?.provas?.length ? profile.provas : profile?.proximaProva ? [profile.proximaProva] : [];

  return [...provas]
    .filter((prova): prova is Prova => Boolean(prova?.dataProva))
    .sort((a, b) => a.dataProva.localeCompare(b.dataProva))
    .map((prova) => ({
      date: formatRaceDate(prova.dataProva),
      label: prova.nomeProva,
      tag: prova.provaAlvo ? 'ALVO' : 'PRINCIPAL',
    }));
}

export function statusToSegment(status: CoachAtletaStatus): SegmentFilter {
  if (status === 'warning') return 'attention';
  if (status === 'danger') return 'drop';
  if (status === 'paused') return 'stable';
  return 'stable';
}

export function buildSelectedAthleteFromDashboard(
  roster: CoachAtletaResumo,
  profile: AtletaPerfilCoachDto | null,
): CoachAthleteRow {
  const pmcPoints = profile?.pmc ?? [];
  const adherencePoints = profile?.aderenciaSemanal ?? [];
  const firstWorkout = profile?.planoVigente?.treinos[0] ?? null;
  const latestPmc = pmcPoints[pmcPoints.length - 1] ?? null;
  const latestAdherence = adherencePoints[adherencePoints.length - 1] ?? null;

  return {
    id: roster.atletaId,
    name: profile?.nomeAtleta ?? roster.nome,
    discipline: profile?.objetivo ?? roster.fase ?? 'Corrida',
    age: profile?.idade ?? 0,
    nivelExperiencia: profile?.nivelExperiencia ?? null,
    gender: '',
    weeksOnPlan: 0,
    segment: statusToSegment(roster.status),
    planStatus: profile?.planoVigente?.reviewStatus === 'AGUARDANDO_REVISAO' ? 'ATRASADO' : 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: statusLabel(roster.status),
    decision: 'PENDING',
    adherence: roster.aderenciaPercentual ?? latestAdherence?.percentual ?? 0,
    load7d: roster.weeklyVolume,
    loadDelta: calcularLoadDelta(pmcPoints),
    delay: 0,
    nextWorkout: {
      title: firstWorkout ? formatWorkoutTypeLabel(firstWorkout.tipoTreino) : 'Sem treino planejado',
      when: firstWorkout ? firstWorkout.diaSemana : 'Sem data',
      zone: firstWorkout?.zonaAlvo ?? '—',
      duration: formatDuration(firstWorkout?.duracaoMin),
      distance: firstWorkout ? `${firstWorkout.distanciaKm} km` : '—',
      objective: firstWorkout ? 'Treino vindo do backend.' : 'Nenhum treino planejado no plano vigente.',
    },
    lastWorkouts: [],
    raceCalendar: buildRaceCalendarFromProfile(profile),
    loadTrend: pmcPoints.map((p) => p.ctl).length > 0 ? pmcPoints.map((p) => p.ctl) : [roster.weeklyVolume],
    adherenceTrend: adherencePoints.map((p) => p.percentual),
    notes: profile?.avisos?.length ? profile.avisos.join(' · ') : 'Sem observações adicionais.',
    suggestedActions: profile?.sinaisRecentes.length
      ? profile.sinaisRecentes.map((s) => s.acaoSugerida).slice(0, 3)
      : ['Abrir o perfil do atleta para detalhes completos'],
    quickStats: {
      acuteLoad: latestPmc?.atl ?? roster.weeklyVolume,
      monotony: calcularMonotonia(pmcPoints),
      tsb: latestPmc?.tsb ?? null,
      acwr: calcularAcwr(latestPmc?.atl ?? null, latestPmc?.ctl ?? null),
      recovery: latestAdherence?.percentual ?? 0,
    },
  };
}

export function buildRosterRowFromSummary(roster: CoachAtletaResumo): CoachAthleteRow {
  return {
    id: roster.atletaId,
    name: roster.nome,
    discipline: roster.fase ?? 'Corrida',
    age: 0,
    nivelExperiencia: null,
    gender: '',
    weeksOnPlan: 0,
    segment: statusToSegment(roster.status),
    planStatus: roster.status === 'paused' ? 'ATRASADO' : 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: statusLabel(roster.status),
    decision: 'PENDING',
    adherence: roster.aderenciaPercentual ?? 0,
    load7d: roster.weeklyVolume,
    loadDelta: 0,
    delay: 0,
    nextWorkout: {
      title: 'Resumo do dashboard',
      when: '—',
      zone: '—',
      duration: '—',
      distance: '—',
      objective: 'Abra o atleta para ver o detalhe completo.',
    },
    lastWorkouts: [],
    raceCalendar: [],
    loadTrend: [roster.weeklyVolume],
    adherenceTrend: [],
    notes: 'Resumo agregado carregado do dashboard.',
    suggestedActions: ['Abrir o perfil do atleta'],
    quickStats: {
      acuteLoad: roster.weeklyVolume,
      monotony: 1,
      tsb: null,
      acwr: calcularAcwr(roster.atl ?? null, roster.ctl ?? null),
      recovery: 0,
    },
  };
}
