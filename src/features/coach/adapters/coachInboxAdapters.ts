import { differenceInCalendarDays, parseISO, startOfDay, subDays } from 'date-fns';
import { formatWorkoutTypeLabel, statusLabel } from '../components/coachInboxHelpers';
import type {
  AttentionReason,
  AttentionSeverity,
  CoachAtletaResumo,
  CoachAtletaStatus,
  CoachAttentionItem,
  CoachDashboardRosterPage,
} from '../../../types/Coach';
import type { DashboardStatusFilter } from '../hooks/useDashboardFilters';
import type { AtletaPerfilCoachDto, PlanoVigenteDto, PmcPontoRaw, TreinoPlanejadoResumoDto } from '../../../types/AtletaPerfilCoach';
import { DIA_SEMANA_LABELS } from '../../../types/Atleta';
import { indiceDoDia, weekDatesFromInicio } from '../../../utils/semana';
import type { Prova } from '../../../types/Prova';
import type { CoachAthleteRow, RaceItem, SegmentFilter } from '../types/CoachInbox';
import { formFromTSB } from '../types/AthleteForm';
import {
  assessAcwrConfidence,
  buildAdherenceWindowFromAderencia4Semanas,
  buildWeeklyDiagnosis,
  calculateLoadDelta7d,
  classifyGaps,
  detectDataGaps,
  DIAGNOSIS_WEEKS,
  isFieldAvailable,
} from './diagnosisChartsAdapters';
import type { FormVariant, MetricTone } from '../types/AthleteForm';

/** Dias civis que a janela de monotonia/strain cobre, contando hoje. */
const JANELA_MONOTONIA_DIAS = 7;
/** Menos dias com treino que isso não sustenta desvio padrão com sentido. */
export const MONOTONIA_MIN_DIAS = 3;

/**
 * TSS positivos dos 7 dias civis até `hoje` (descansos com tss=0 são descartados). Por data, não
 * por posição: numa série que parou há 12 dias, as 7 últimas posições são treinos antigos.
 */
function tssPositivosDaJanela(pmcPoints: PmcPontoRaw[], hoje: Date): number[] {
  const fim = startOfDay(hoje);
  const inicio = subDays(fim, JANELA_MONOTONIA_DIAS - 1);
  return pmcPoints
    .filter((p) => {
      const d = parseISO(p.data);
      return d >= inicio && d <= fim;
    })
    .map((p) => p.tss ?? 0)
    .filter((v) => v > 0);
}

export function contarDiasComTreino7d(pmcPoints: PmcPontoRaw[], hoje: Date): number {
  return tssPositivosDaJanela(pmcPoints, hoje).length;
}

/** Monotonia (média ÷ desvio do TSS da semana). `null` sem base — antes caía em 1.0, que parecia medição. */
export function calcularMonotonia(pmcPoints: PmcPontoRaw[], hoje: Date): number | null {
  const tss = tssPositivosDaJanela(pmcPoints, hoje);
  if (tss.length < MONOTONIA_MIN_DIAS) return null;
  const media = tss.reduce((a, b) => a + b, 0) / tss.length;
  const variancia = tss.reduce((a, b) => a + (b - media) ** 2, 0) / tss.length;
  const stddev = Math.sqrt(variancia);
  return stddev === 0 ? 1.0 : parseFloat((media / stddev).toFixed(2));
}

/**
 * Variação % de **CTL** (condicionamento) em 7 posições do array. NÃO é variação de carga — para
 * isso use `calculateLoadDelta7d`. Era exibida como "% vs semana anterior" ao lado de km.
 */
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

/**
 * Training Strain (Foster) = TSS_semanal × monotonia.
 * Une volume e homogeneidade num único sinal de qualidade do ciclo.
 * Fallback: null quando há menos de 3 pontos de TSS positivos.
 */
export function calcularStrain(pmcPoints: PmcPontoRaw[], hoje: Date): number | null {
  const monotonia = calcularMonotonia(pmcPoints, hoje);
  if (monotonia == null) return null;
  const tssSemanal = tssPositivosDaJanela(pmcPoints, hoje).reduce((a, b) => a + b, 0);
  return parseFloat((tssSemanal * monotonia).toFixed(0));
}

/**
 * Zona do Training Strain (corredores recreativos, CTL 40–80 TSS/dia).
 * < 150 baixo; 150–300 moderado; 300–600 alto; > 600 crítico.
 */
export function getStrainZone(strain: number | null): { tone: MetricTone; label: string } {
  if (strain == null) return { tone: 'neutral', label: 'Sem dados' };
  if (strain >= 600) return { tone: 'danger', label: 'Crítico' };
  if (strain >= 300) return { tone: 'warning', label: 'Alto' };
  if (strain >= 150) return { tone: 'success', label: 'Moderado' };
  return { tone: 'neutral', label: 'Baixo' };
}

/** Tom da monotonia (Foster): acima de 1.4 sinaliza treino pouco variado. */
export function getMonotonyTone(monotony: number): MetricTone {
  return monotony > 1.4 ? 'warning' : 'success';
}

/**
 * Zona de risco do ACWR (Acute:Chronic Workload Ratio).
 * Sweet spot 0.8–1.3; atenção até 1.5; acima é risco de lesão.
 */
export function getAcwrZone(acwr: number | null): { tone: MetricTone; label: string } {
  if (acwr == null) return { tone: 'neutral', label: 'Sem dados' };
  if (acwr > 1.5) return { tone: 'danger', label: 'Risco' };
  if (acwr > 1.3) return { tone: 'warning', label: 'Atenção' };
  if (acwr >= 0.8) return { tone: 'success', label: 'Ideal' };
  return { tone: 'warning', label: 'Muito baixo' };
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

/** Provas do perfil que têm data, ordenadas por data crescente (não muta o array original). */
function provasOrdenadas(profile: AtletaPerfilCoachDto | null): Prova[] {
  const provas = profile?.provas?.length ? profile.provas : profile?.proximaProva ? [profile.proximaProva] : [];
  return [...provas]
    .filter((prova): prova is Prova => Boolean(prova?.dataProva))
    .sort((a, b) => a.dataProva.localeCompare(b.dataProva));
}

export function buildRaceCalendarFromProfile(profile: AtletaPerfilCoachDto | null): RaceItem[] {
  return provasOrdenadas(profile)
    .map((prova) => ({
      date: formatRaceDate(prova.dataProva),
      label: prova.nomeProva,
      tag: prova.provaAlvo ? 'ALVO' : 'PRINCIPAL',
    }));
}

/**
 * Previsão de forma no dia da prova via decaimento exponencial do PMC (taper puro, carga zero):
 * CTL(d) = CTL₀·e^(−d/42), ATL(d) = ATL₀·e^(−d/7), TSB(d) = CTL(d) − ATL(d).
 * Fallback null quando falta ctl/atl ou a prova já passou (diasAteProva ≤ 0).
 */
export function calcularPrevisaoForma(
  ctl: number | null,
  atl: number | null,
  diasAteProva: number,
): { tsbPrevisto: number; formaPrevista: FormVariant } | null {
  if (ctl == null || atl == null || diasAteProva <= 0) return null;
  const ctlPrevisto = ctl * Math.exp(-diasAteProva / 42);
  const atlPrevisto = atl * Math.exp(-diasAteProva / 7);
  const tsbPrevisto = parseFloat((ctlPrevisto - atlPrevisto).toFixed(1));
  // DÍVIDA: `formFromTSB` (limiar local) sobrevive só aqui — classifica um TSB
  // PROJETADO (futuro), que o backend não resolve. Migrar para as fronteiras
  // expostas pelo backend na change de follow-up (cond. add-taper-guidance).
  return { tsbPrevisto, formaPrevista: formFromTSB(tsbPrevisto) };
}

/** Dias até a próxima prova futura do perfil. -1 quando não há prova cadastrada. */
export function calcularDiasAteProva(profile: AtletaPerfilCoachDto | null, hoje: Date): number {
  const proxima = provasOrdenadas(profile)[0];
  if (!proxima) return -1;
  // Dia civil: a conta em horas somava um dia de manhã (ceil sobre o meio-dia da prova).
  return differenceInCalendarDays(parseISO(proxima.dataProva), hoje);
}

export function statusToSegment(status: CoachAtletaStatus): SegmentFilter {
  if (status === 'warning') return 'attention';
  if (status === 'danger') return 'drop';
  if (status === 'paused') return 'stable';
  return 'stable';
}

/**
 * Próximo treino a partir de hoje: a data vem de `semanaInicio` + dia da semana (o resumo não traz
 * data). Antes era `treinos[0]`, o primeiro do plano — na terça, o coach via o treino de segunda.
 * Treino de hoje já executado sai; só `PENDENTE` (ou sem status) ainda está por fazer.
 */
export function pickNextWorkout(
  plano: PlanoVigenteDto | null,
  agora: Date,
): { treino: TreinoPlanejadoResumoDto; when: string } | null {
  if (!plano?.treinos.length) return null;
  const hoje = startOfDay(agora);
  const datas = weekDatesFromInicio(plano.semanaInicio);
  const proximo = plano.treinos
    .map((treino) => ({ treino, i: indiceDoDia(treino.diaSemana) }))
    .filter(({ treino, i }) => i >= 0 && (treino.statusExecucao == null || treino.statusExecucao === 'PENDENTE'))
    .map(({ treino, i }) => ({ treino, dias: differenceInCalendarDays(datas[i], hoje) }))
    .filter(({ dias }) => dias >= 0)
    .sort((a, b) => a.dias - b.dias)[0];
  if (!proximo) return null;
  const when =
    proximo.dias === 0
      ? 'Hoje'
      : proximo.dias === 1
        ? 'Amanhã'
        : DIA_SEMANA_LABELS[proximo.treino.diaSemana.trim().toUpperCase() as keyof typeof DIA_SEMANA_LABELS] ?? proximo.treino.diaSemana;
  return { treino: proximo.treino, when };
}

export function buildSelectedAthleteFromDashboard(
  roster: CoachAtletaResumo,
  profile: AtletaPerfilCoachDto | null,
  hoje: Date = new Date(),
): CoachAthleteRow {
  const pmcPoints = profile?.pmc ?? [];
  const adherencePoints = profile?.aderenciaSemanal ?? [];
  const distance = profile?.distanceSummary ?? null;
  const proximo = pickNextWorkout(profile?.planoVigente ?? null, hoje);
  const firstWorkout = proximo?.treino ?? null;
  const latestPmc = pmcPoints[pmcPoints.length - 1] ?? null;
  const latestAdherence = adherencePoints[adherencePoints.length - 1] ?? null;

  const diasAteProva = calcularDiasAteProva(profile, hoje);
  const previsao = calcularPrevisaoForma(latestPmc?.ctl ?? null, latestPmc?.atl ?? null, diasAteProva);
  const adherenceAvailable = isFieldAvailable(profile?.avisos, 'aderenciaSemanal');
  const pmcAvailable = isFieldAvailable(profile?.avisos, 'pmc');
  const dataGaps = classifyGaps(detectDataGaps(pmcPoints, hoje), adherencePoints, distance);
  // Mesmo campo que alimenta `roster.aderenciaPercentual` (D5): tile e roster concordam por
  // construção, não por dois cálculos (fix-adherence-count-until-today).
  const adherenceWindow = buildAdherenceWindowFromAderencia4Semanas(profile?.aderencia4Semanas);

  return {
    id: roster.atletaId,
    name: profile?.nomeAtleta ?? roster.nome,
    discipline: profile?.objetivo ?? roster.fase ?? 'Corrida',
    age: profile?.idade ?? 0,
    nivelExperiencia: profile?.nivelExperiencia ?? null,
    gender: '',
    weeksOnPlan: 0,
    segment: statusToSegment(roster.status),
    status: roster.status,
    planStatus: profile?.planoVigente?.reviewStatus === 'AGUARDANDO_REVISAO' ? 'ATRASADO' : 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: statusLabel(roster.status),
    decision: 'PENDING',
    adherence: adherenceWindow?.percent ?? roster.aderenciaPercentual ?? latestAdherence?.percentual ?? 0,
    adherenceWindow,
    adherenceAvailable,
    pmcAvailable,
    load7d: roster.weeklyVolume,
    loadDelta: calculateLoadDelta7d(pmcPoints, hoje),
    distance7d: distance ? { lastKm: distance.last7DaysKm, previousKm: distance.previous7DaysKm } : null,
    delay: 0,
    nextWorkout: {
      title: firstWorkout ? formatWorkoutTypeLabel(firstWorkout.tipoTreino) : 'Sem treino planejado',
      when: proximo?.when ?? 'Sem data',
      zone: firstWorkout?.zonaAlvo ?? '—',
      duration: formatDuration(firstWorkout?.duracaoMin),
      distance: firstWorkout ? `${firstWorkout.distanciaKm} km` : '—',
      objective: firstWorkout
        ? 'Treino vindo do backend.'
        : profile?.planoVigente?.treinos.length
          ? 'Nenhum treino restante no plano vigente.'
          : 'Nenhum treino planejado no plano vigente.',
    },
    raceCalendar: buildRaceCalendarFromProfile(profile),
    weeklyDiagnosis: buildWeeklyDiagnosis(pmcPoints, adherencePoints, dataGaps, hoje, DIAGNOSIS_WEEKS, distance),
    dataGaps,
    notes: profile?.avisos?.length ? profile.avisos.join(' · ') : 'Sem observações adicionais.',
    suggestedActions: profile?.sinaisRecentes.length
      ? profile.sinaisRecentes.map((s) => s.acaoSugerida).slice(0, 3)
      : ['Abrir o perfil do atleta para detalhes completos'],
    quickStats: {
      // Distingue "zero legítimo" (treinou 0 km esta semana) de "sem dado na janela" (nunca
      // sincronizou). Os campos abaixo têm fallback numérico, e número com fallback é
      // indistinguível de medição real depois que sai do adapter.
      hasWindowData: pmcPoints.length > 0,
      // ATL é TSS/dia. O fallback antigo era `roster.weeklyVolume` (km) — outra unidade no mesmo campo.
      acuteLoad: latestPmc?.atl ?? null,
      monotony: calcularMonotonia(pmcPoints, hoje),
      trainingDays7d: contarDiasComTreino7d(pmcPoints, hoje),
      tsb: latestPmc?.tsb ?? null,
      // precedência: PMC mais recente (mais granular/atual) > roster (pode estar stale)
      statusForma: latestPmc?.statusForma ?? roster.statusForma ?? null,
      acwr: calcularAcwr(latestPmc?.atl ?? null, latestPmc?.ctl ?? null),
      acwrConfidence: assessAcwrConfidence(pmcPoints, dataGaps, hoje),
      strain: calcularStrain(pmcPoints, hoje),
    },
    racePrediction: previsao ? { diasAteProva, ...previsao } : null,
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
    status: roster.status,
    planStatus: roster.status === 'paused' ? 'ATRASADO' : 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: statusLabel(roster.status),
    decision: 'PENDING',
    adherence: roster.aderenciaPercentual ?? 0,
    adherenceWindow: null,
    adherenceAvailable: true,
    pmcAvailable: true,
    load7d: roster.weeklyVolume,
    loadDelta: null,
    distance7d: null,
    delay: 0,
    nextWorkout: {
      title: 'Resumo do dashboard',
      when: '—',
      zone: '—',
      duration: '—',
      distance: '—',
      objective: 'Abra o atleta para ver o detalhe completo.',
    },
    raceCalendar: [],
    weeklyDiagnosis: [],
    dataGaps: [],
    notes: 'Resumo agregado carregado do dashboard.',
    suggestedActions: ['Abrir o perfil do atleta'],
    quickStats: {
      // Linha do roster: o dashboard não traz série PMC, então nunca há dados de janela aqui — o
      // painel completo vem do perfil, buscado à parte.
      hasWindowData: false,
      acuteLoad: null,
      monotony: null,
      trainingDays7d: 0,
      tsb: null,
      statusForma: roster.statusForma ?? null,
      acwr: calcularAcwr(roster.atl ?? null, roster.ctl ?? null),
      acwrConfidence: null, // roster não traz histórico; avaliado só no perfil
      strain: null, // resumo do roster não traz histórico PMC; strain só no perfil completo
    },
    racePrediction: null, // resumo não traz provas nem PMC
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Composição da lista do inbox (refine-inbox-visual-hierarchy, gate 1.1)
// ─────────────────────────────────────────────────────────────────────────────

/** Motivo e severidade de um atleta que precisa de atenção, já resolvidos para exibição. */
export interface AttentionInfo {
  severity: AttentionSeverity;
  reason: AttentionReason;
  suggestedAction: string;
  /** Dias sem treinar (inatividade) ou idade do alerta; `null` quando não há dado. */
  recencyDays: number | null;
}

/**
 * Linha da lista principal do inbox.
 *
 * A união é obrigatória, não estilística: `CoachAttentionItem` traz nome, severidade e motivo, mas
 * **nenhuma** das métricas que a linha de roster exibe (aderência, volume, forma). Um tipo só
 * forçaria preencher esses campos com zero para o atleta que veio só da fila de atenção — e zero
 * com cara de medição real é pior do que ausência declarada.
 */
export type InboxQueueRow =
  | { source: 'roster'; atletaId: string; row: CoachAthleteRow; attention: AttentionInfo | null }
  | { source: 'attention-only'; atletaId: string; athleteName: string; attention: AttentionInfo };

export interface InboxQueue {
  rows: InboxQueueRow[];
  /** Quantos itens estão fixados no topo (atenção), em qualquer página. */
  pinnedCount: number;
  /** Atletas em atenção que o filtro/busca ativo esconde — a UI precisa dizer que existem. */
  hiddenAttentionCount: number;
  /** Total do roster, **sem** os fixados: é o `count` do `TablePagination`. */
  rosterTotalElements: number;
}

const ORDEM_SEVERIDADE: Record<AttentionSeverity, number> = { CRITICA: 0, ALTA: 1, MEDIA: 2 };

function diasEntre(inicio: string | undefined, hoje: Date): number | null {
  if (!inicio) return null;
  const ms = Date.parse(inicio);
  if (Number.isNaN(ms)) return null;
  return Math.floor((hoje.getTime() - ms) / 86_400_000);
}

/**
 * "Inatividade · 14d" só é verdade se o número forem dias **sem treinar**. Para os demais motivos
 * não existe esse dado, e a idade do alerta é a informação honesta — usar `generatedAt` como se
 * fosse inatividade produziria um número errado com aparência de certo.
 */
function resolverRecencia(item: CoachAttentionItem, resumo: CoachAtletaResumo | undefined, hoje: Date): number | null {
  if (item.primaryReason === 'INATIVIDADE' && resumo?.lastActivity) {
    return diasEntre(resumo.lastActivity, hoje);
  }
  return diasEntre(item.generatedAt, hoje);
}

/**
 * Compõe a lista principal do inbox a partir do roster paginado e da fila de atenção.
 *
 * **O problema que isto resolve.** As duas listas vêm da mesma resposta (`GET /coach/dashboard`),
 * mas o roster é paginado em 10 e a fila de atenção não. Um atleta em alerta que caia na página 2
 * simplesmente não aparece — e mostrar quem precisa de atenção é o job da tela. Por isso os itens
 * de atenção são **fixados acima da página**, em todas elas.
 *
 * **Fixar resolve paginação; filtro é outro mecanismo.** Item de atenção que o filtro ativo exclui
 * não entra em `rows` — sai em `hiddenAttentionCount`, para a UI dizer que ele existe em vez de
 * escondê-lo em silêncio. Filtro de status derruba todo item `attention-only`: o DTO da fila não
 * carrega o status do atleta, então afirmar que ele casa com o filtro seria invenção.
 */
export function buildInboxQueue(
  roster: CoachDashboardRosterPage,
  attentionQueue: CoachAttentionItem[],
  filters: { status: DashboardStatusFilter; search: string },
  hoje: Date = new Date(),
): InboxQueue {
  const porId = new Map(roster.items.map((item) => [item.atletaId, item]));
  const busca = filters.search.trim().toLowerCase();

  const ordenados = [...attentionQueue].sort((a, b) =>
    ORDEM_SEVERIDADE[a.severity] - ORDEM_SEVERIDADE[b.severity] || b.priorityScore - a.priorityScore);

  const fixados: InboxQueueRow[] = [];
  let hiddenAttentionCount = 0;

  for (const item of ordenados) {
    const resumo = porId.get(item.atletaId);
    const nome = resumo?.nome ?? item.athleteName;

    const passaBusca = busca.length === 0 || nome.toLowerCase().includes(busca);
    // Sem `resumo` não há status para comparar — o DTO da fila de atenção não o traz.
    const passaStatus = filters.status === 'all' || resumo?.status === filters.status;

    if (!passaBusca || !passaStatus) {
      hiddenAttentionCount += 1;
      continue;
    }

    const attention: AttentionInfo = {
      severity: item.severity,
      reason: item.primaryReason,
      suggestedAction: item.suggestedAction,
      recencyDays: resolverRecencia(item, resumo, hoje),
    };

    fixados.push(resumo
      ? { source: 'roster', atletaId: item.atletaId, row: buildRosterRowFromSummary(resumo), attention }
      : { source: 'attention-only', atletaId: item.atletaId, athleteName: nome, attention });
  }

  const fixadosIds = new Set(fixados.map((r) => r.atletaId));
  const restante: InboxQueueRow[] = roster.items
    .filter((item) => !fixadosIds.has(item.atletaId))
    .map((item) => ({
      source: 'roster' as const,
      atletaId: item.atletaId,
      row: buildRosterRowFromSummary(item),
      attention: null,
    }));

  return {
    rows: [...fixados, ...restante],
    pinnedCount: fixados.length,
    hiddenAttentionCount,
    // Deliberadamente sem somar os fixados: eles são seção acima da página, não conteúdo dela.
    // Somá-los faria "1 de N páginas" mentir e a última página vir curta.
    rosterTotalElements: roster.totalElements,
  };
}
