import { formatWorkoutTypeLabel, statusLabel } from '../components/coachInboxHelpers';
import type { CoachAtletaResumo, CoachAtletaStatus } from '../../../types/Coach';
import type { AtletaPerfilCoachDto } from '../../../types/AtletaPerfilCoach';
import type { Prova } from '../../../types/Prova';
import type { CoachAthleteRow, RaceItem, SegmentFilter } from '../types/CoachInbox';

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
    age: 0,
    gender: '',
    weeksOnPlan: 0,
    segment: statusToSegment(roster.status),
    planStatus: profile?.planoVigente?.reviewStatus === 'AGUARDANDO_REVISAO' ? 'ATRASADO' : 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: statusLabel(roster.status),
    decision: 'PENDING',
    adherence: latestAdherence?.percentual ?? 0,
    load7d: roster.weeklyVolume,
    loadDelta: 0,
    delay: 0,
    nextWorkout: {
      title: firstWorkout ? formatWorkoutTypeLabel(firstWorkout.tipoTreino) : 'Sem treino planejado',
      when: firstWorkout ? firstWorkout.diaSemana : 'Sem data',
      zone: firstWorkout?.zonaAlvo ?? '—',
      duration: firstWorkout?.duracaoMin ?? '—',
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
      acuteLoad: latestPmc?.ctl ?? roster.weeklyVolume,
      monotony: 1,
      fatigue: latestPmc && latestPmc.tsb < -10 ? 'Alta' : latestPmc && latestPmc.tsb < 0 ? 'Média' : 'Baixa',
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
    gender: '',
    weeksOnPlan: 0,
    segment: statusToSegment(roster.status),
    planStatus: roster.status === 'paused' ? 'ATRASADO' : 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: statusLabel(roster.status),
    decision: 'PENDING',
    adherence: 0,
    load7d: roster.weeklyVolume,
    loadDelta: 0,
    delay: 0,
    nextWorkout: {
      title: 'Resumo do dashboard',
      when: '—',
      zone: '—',
      duration: '—',
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
      fatigue: roster.status === 'danger' ? 'Alta' : roster.status === 'warning' ? 'Média' : 'Baixa',
      recovery: 0,
    },
  };
}
