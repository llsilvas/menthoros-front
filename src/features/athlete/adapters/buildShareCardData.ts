import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { GpsTrace, TreinoRealizadoDto } from '../../../types/TreinoManual';
import { decodePolyline } from './buildRouteFromGpsTrace';
import type { EtapaRealizadaDetalhe } from '../../../types/TreinoRealizado';
import type { EtapaTreino, TreinoPlanejado } from '../../../types/TreinoPlanejado';
import { activeTheme, workoutTypeColor } from '../../../theme/activeTheme';
import { tipoTreinoLabel } from './homeAdapter';
import { formatPace } from '../../coach/adapters/zoneAnchors';
import type {
  GarminAttributionView,
  PlanVsActualView,
  RouteView,
  PlannedBlockView,
  ShareCardData,
  ShareModel,
  ShareSignatureView,
  SplitsView,
  TreadmillView,
  WeekView,
} from '../types/ShareCard';

export interface ShareCardInput {
  realizado: TreinoRealizadoDto;
  /** Planejado vinculado ao realizado, quando o treino veio do plano. */
  planejado: TreinoPlanejado | null;
  /** Realizados recentes do atleta; o adapter recorta a semana do treino. */
  recentes: TreinoRealizadoDto[];
  assessoriaNome: string | null;
  /** Trajeto do realizado; ausente quando o treino não tem GPS ou a busca falhou. */
  gpsTrace?: GpsTrace | null;
}

const DIAS_CURTOS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

/** Altura relativa de cada tipo de etapa no perfil do plano: o olho sobe com a intensidade. */
const ALTURA_POR_ETAPA: Record<string, number> = {
  AQUECIMENTO: 38,
  DESAQUECIMENTO: 30,
  SOLTURA: 30,
  RECUPERACAO: 18,
  DESCANSO: 12,
  PRINCIPAL: 72,
  ESFORCO: 96,
  TIRO: 96,
};

function fonteValue(t: TreinoRealizadoDto): string {
  const f = t.fonteDados as unknown;
  if (typeof f === 'string') return f;
  return (f as { value?: string } | null)?.value ?? '';
}

function isGarmin(t: TreinoRealizadoDto): boolean {
  return fonteValue(t).toUpperCase() === 'GARMIN';
}

/**
 * Regra única da atribuição Garmin (design D4): um treino → "GARMIN {modelo}" ou "GARMIN";
 * agregado com algum treino Garmin → "GARMIN" + frase de dado derivado; nenhum → null.
 */
export function garminAttributionFor(treinos: TreinoRealizadoDto[], agregado = false): GarminAttributionView | null {
  const garmin = treinos.filter(isGarmin);
  if (garmin.length === 0) return null;
  if (agregado) return { label: 'GARMIN', derived: true };
  const modelo = garmin[0].deviceName?.trim();
  return { label: modelo ? `GARMIN ${modelo.toUpperCase()}` : 'GARMIN', derived: false };
}

/** Iniciais das duas primeiras palavras significativas ("Assessoria Pace Forte" → "PF"). */
export function siglaDe(nome: string): string {
  const ignorar = new Set(['assessoria', 'de', 'da', 'do', 'das', 'dos', 'e']);
  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  const uteis = palavras.filter((p) => !ignorar.has(p.toLowerCase()));
  const base = uteis.length > 0 ? uteis : palavras;
  return base.slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');
}

function tipoEtapaValue(e: EtapaTreino): string {
  const t = e.tipoEtapa as unknown;
  return (typeof t === 'string' ? t : (t as { value?: string })?.value ?? '').toUpperCase();
}

function corDaEtapa(tipo: string): string {
  const s = activeTheme.trainingStage;
  if (tipo === 'AQUECIMENTO') return s.aquecimento;
  if (tipo === 'DESAQUECIMENTO' || tipo === 'SOLTURA') return s.desaquecimento;
  if (tipo === 'RECUPERACAO' || tipo === 'DESCANSO') return s.recuperacao;
  if (tipo === 'ESFORCO' || tipo === 'TIRO') return s.esforco;
  return s.principal;
}

function blocosDoPlano(etapas: EtapaTreino[]): PlannedBlockView[] {
  const ordenadas = [...etapas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const blocos: PlannedBlockView[] = [];
  ordenadas.forEach((e, i) => {
    const tipo = tipoEtapaValue(e);
    const peso = e.duracaoSeg ?? (e.duracaoMin != null ? e.duracaoMin * 60 : (e.distanciaKm ?? 1) * 300);
    const reps = Math.max(1, e.repeticoes ?? 1);
    for (let r = 0; r < reps; r++) {
      blocos.push({
        key: `${i}-${r}`,
        weight: Math.max(1, peso),
        heightPct: ALTURA_POR_ETAPA[tipo] ?? 60,
        color: corDaEtapa(tipo),
      });
    }
  });
  return blocos;
}

function segundosDe(duracao?: string): number | null {
  if (!duracao) return null;
  const p = duracao.split(':').map(Number);
  if ((p.length !== 2 && p.length !== 3) || p.some((n) => !Number.isFinite(n))) return null;
  const [h, m, s] = p.length === 3 ? p : [0, p[0], p[1]];
  return h * 3600 + m * 60 + s;
}

function formatarDuracao(seg: number): string {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = Math.round(seg % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatarHoras(seg: number): string {
  const h = Math.floor(seg / 3600);
  const m = Math.round((seg % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
}

function paceDe(seg: number, km: number): string {
  return formatPace(seg / km);
}

/** Pace da volta em segundos/km: `paceMedia` ("4:18") ou derivado de duração e distância. */
function paceSegDaEtapa(e: EtapaRealizadaDetalhe): number | null {
  const pace = e.paceMedia?.match(/(\d{1,2}):(\d{2})/);
  if (pace) return Number(pace[1]) * 60 + Number(pace[2]);
  const seg = segundosDe(e.duracao);
  if (seg && e.distanciaKm && e.distanciaKm > 0) return Math.round(seg / e.distanciaKm);
  return null;
}

function dataLabel(iso: string): string {
  return format(parseISO(iso), "EEE, d 'de' MMM", { locale: ptBR });
}

function buildPlano(input: ShareCardInput): PlanVsActualView | null {
  const { realizado, planejado } = input;
  const etapasRealizadas = realizado.etapasRealizadas ?? [];
  if (!planejado || !planejado.etapas?.length || etapasRealizadas.length === 0) return null;
  const seg = segundosDe(realizado.duracaoMin) ?? 0;
  return {
    titulo: planejado.descricao?.trim() || tipoTreinoLabel(planejado.tipoTreino),
    dataLabel: dataLabel(realizado.dataTreino),
    blocos: blocosDoPlano(planejado.etapas),
    distanciaKm: realizado.distanciaKm,
    distanciaPlanejadaKm: planejado.distanciaKm,
    duracao: formatarDuracao(seg),
    paceMedio: realizado.distanciaKm && seg ? paceDe(seg, realizado.distanciaKm) : undefined,
    fcMedia: realizado.fcMedia,
    attribution: garminAttributionFor([realizado]),
  };
}

function buildParciais(input: ShareCardInput): SplitsView | null {
  const { realizado } = input;
  const voltas = [...(realizado.etapasRealizadas ?? [])]
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((e, i) => ({ n: i + 1, paceSeg: paceSegDaEtapa(e) }))
    .filter((v): v is { n: number; paceSeg: number } => v.paceSeg != null && v.paceSeg > 0);
  if (voltas.length < 2) return null;
  const melhor = Math.min(...voltas.map((v) => v.paceSeg));
  const seg = segundosDe(realizado.duracaoMin) ?? 0;
  return {
    titulo: tipoTreinoLabel(realizado.tipoTreino),
    dataLabel: dataLabel(realizado.dataTreino),
    splits: voltas.map((v) => ({
      n: v.n,
      paceSeg: v.paceSeg,
      pace: formatPace(v.paceSeg),
      isBest: v.paceSeg === melhor,
    })),
    distanciaKm: realizado.distanciaKm,
    duracao: formatarDuracao(seg),
    attribution: garminAttributionFor([realizado]),
  };
}

function buildSemana(input: ShareCardInput): WeekView {
  const inicio = startOfWeek(parseISO(input.realizado.dataTreino), { weekStartsOn: 1 });
  const isos = Array.from({ length: 7 }, (_, i) => format(addDays(inicio, i), 'yyyy-MM-dd'));
  const daSemana = input.recentes.filter((t) => isos.includes(t.dataTreino));
  // O treino aberto sempre conta, mesmo se a lista recente vier sem ele.
  if (!daSemana.some((t) => t.id === input.realizado.id)) daSemana.push(input.realizado);

  const dias = isos.map((iso, i) => {
    const doDia = daSemana.filter((t) => t.dataTreino === iso);
    const km = doDia.reduce((acc, t) => acc + (t.distanciaKm ?? 0), 0);
    const maior = [...doDia].sort((a, b) => (b.distanciaKm ?? 0) - (a.distanciaKm ?? 0))[0];
    return { label: DIAS_CURTOS[i], km: Math.round(km * 10) / 10, color: maior ? workoutTypeColor(maior.tipoTreino) : null };
  });
  const totalSeg = daSemana.reduce((acc, t) => acc + (segundosDe(t.duracaoMin) ?? 0), 0);
  return {
    rangeLabel: `${format(inicio, 'd', { locale: ptBR })}–${format(addDays(inicio, 6), "d 'de' MMM", { locale: ptBR })}`,
    totalKm: Math.round(dias.reduce((acc, d) => acc + d.km, 0) * 10) / 10,
    dias,
    treinos: daSemana.length,
    tempoTotal: formatarHoras(totalSeg),
    attribution: garminAttributionFor(daSemana, true),
  };
}

export function buildShareCardData(input: ShareCardInput): ShareCardData {
  const plano = buildPlano(input);
  const parciais = buildParciais(input);
  const rota = buildRota(input);
  const esteira = buildEsteira(input);
  const availableModels: ShareModel[] = [];
  if (plano) availableModels.push('plano');
  if (parciais) availableModels.push('parciais');
  if (rota) availableModels.push('rota', 'stickers');
  if (esteira) {
    // Esteira sem GPS também tem Foto: o adesivo do trajeto vira o selo.
    if (!rota) availableModels.push('stickers');
    availableModels.push('esteira');
  }
  availableModels.push('semana');
  const signature: ShareSignatureView | null = input.assessoriaNome?.trim()
    ? { sigla: siglaDe(input.assessoriaNome), nome: input.assessoriaNome.trim() }
    : null;
  return { availableModels, signature, plano, parciais, semana: buildSemana(input), rota, esteira };
}

/** Rota e Stickers só existem com pelo menos 2 pontos de trajeto (CA2 de athlete-share-cards-mapa). */
function buildRota(input: ShareCardInput): RouteView | null {
  const { realizado, gpsTrace } = input;
  if (!gpsTrace?.polyline) return null;
  const pontos = decodePolyline(gpsTrace.polyline);
  if (pontos.length < 2) return null;
  const seg = segundosDe(realizado.duracaoMin) ?? 0;
  return {
    titulo: tipoTreinoLabel(realizado.tipoTreino),
    dataLabel: dataLabel(realizado.dataTreino),
    pontos,
    distanciaKm: realizado.distanciaKm,
    duracao: formatarDuracao(seg),
    paceMedio: realizado.distanciaKm && seg ? paceDe(seg, realizado.distanciaKm) : undefined,
    fcMedia: realizado.fcMedia,
    attribution: garminAttributionFor([realizado]),
  };
}

/** Esteira só com evidência positiva da fonte (CA1 de athlete-share-cards-esteira). */
function buildEsteira(input: ShareCardInput): TreadmillView | null {
  const { realizado } = input;
  if (realizado.esteira !== true) return null;
  const seg = segundosDe(realizado.duracaoMin) ?? 0;
  return {
    titulo: tipoTreinoLabel(realizado.tipoTreino),
    dataLabel: dataLabel(realizado.dataTreino),
    distanciaKm: realizado.distanciaKm,
    duracao: formatarDuracao(seg),
    paceMedio: realizado.distanciaKm && seg ? paceDe(seg, realizado.distanciaKm) : undefined,
    fcMedia: realizado.fcMedia,
    tss: realizado.tssCalculado,
    attribution: garminAttributionFor([realizado]),
  };
}
