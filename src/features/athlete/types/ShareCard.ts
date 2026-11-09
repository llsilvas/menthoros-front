/** View models dos cards de compartilhamento (athlete-share-cards). Montados por `buildShareCardData`. */

export type ShareModel = 'plano' | 'parciais' | 'semana' | 'rota' | 'stickers' | 'esteira';

/**
 * Modelos que podem desenhar o trajeto GPS: exigem o consentimento do atleta
 * (lgpd-trajeto-cards-compartilhamento). Foto só desenha trajeto quando há Rota; na esteira sem GPS
 * o consentimento não é pedido (athlete-share-cards-esteira).
 */
export const MAP_MODELS: ReadonlySet<ShareModel> = new Set<ShareModel>(['rota', 'stickers']);
export type ShareFormat = 'story' | 'feed' | 'quadrado';

/** Atribuição exigida pela Garmin (API Brand Guidelines, Visual and Social Media). */
export interface GarminAttributionView {
  /** "GARMIN FORERUNNER 265" ou "GARMIN". */
  label: string;
  /** Agregado com dado Garmin (card Semana): mostra a frase de dado derivado. */
  derived: boolean;
}

export interface ShareSignatureView {
  sigla: string;
  nome: string;
}

export interface PlannedBlockView {
  key: string;
  /** Peso horizontal relativo (duração ou distância da etapa). */
  weight: number;
  /** Altura relativa 0–100, pela intensidade do tipo de etapa. */
  heightPct: number;
  color: string;
}

export interface PlanVsActualView {
  titulo: string;
  dataLabel: string;
  blocos: PlannedBlockView[];
  distanciaKm?: number;
  distanciaPlanejadaKm?: number;
  duracao: string;
  paceMedio?: string;
  fcMedia?: number;
  attribution: GarminAttributionView | null;
}

export interface SplitView {
  n: number;
  pace: string;
  /** Segundos por km, para a altura da barra. */
  paceSeg: number;
  isBest: boolean;
}

export interface SplitsView {
  titulo: string;
  dataLabel: string;
  splits: SplitView[];
  distanciaKm?: number;
  duracao: string;
  attribution: GarminAttributionView | null;
}

export interface WeekDayView {
  label: string;
  km: number;
  /** Cor do tipo de treino do dia; null em dia sem treino. */
  color: string | null;
}

export interface WeekView {
  rangeLabel: string;
  totalKm: number;
  dias: WeekDayView[];
  treinos: number;
  tempoTotal: string;
  attribution: GarminAttributionView | null;
}

/** Trajeto e números dos modelos com mapa (Rota e Stickers). */
export interface RouteView {
  titulo: string;
  dataLabel: string;
  /** Trajeto decodificado: [lat, lng]. A projeção é feita no tamanho de cada card. */
  pontos: [number, number][];
  distanciaKm?: number;
  duracao: string;
  paceMedio?: string;
  fcMedia?: number;
  attribution: GarminAttributionView | null;
}

/** Card Esteira (athlete-share-cards-esteira, v2 I): km ou tempo em destaque, pace e três blocos. */
export interface TreadmillView {
  titulo: string;
  dataLabel: string;
  distanciaKm?: number;
  duracao: string;
  paceMedio?: string;
  fcMedia?: number;
  tss?: number;
  attribution: GarminAttributionView | null;
}

export interface ShareCardData {
  availableModels: ShareModel[];
  signature: ShareSignatureView | null;
  plano: PlanVsActualView | null;
  parciais: SplitsView | null;
  semana: WeekView;
  rota: RouteView | null;
  esteira: TreadmillView | null;
}

export const SHARE_FORMAT_SIZE: Record<ShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  feed: { width: 1080, height: 1350 },
  quadrado: { width: 1080, height: 1080 },
};

export const SHARE_MODEL_DEFAULT_FORMAT: Record<ShareModel, ShareFormat> = {
  plano: 'story',
  parciais: 'feed',
  semana: 'quadrado',
  rota: 'story',
  stickers: 'story',
  esteira: 'story',
};
