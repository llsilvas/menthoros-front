// Contrato de dados do WorkoutProfile (spec §2.2).
//
// O componente NÃO recebe etapas: recebe um `WorkoutProfile` já resolvido, onde
// zona, intensidade, agrupamento e distribuição foram decididos uma vez só, por
// `selectWorkoutProfile`. Enquanto o cálculo morava dentro do componente, cada
// superfície que desenhava o treino recalculava à sua maneira — foi assim que a
// badge passou a dizer "Z1 100%" sobre blocos laranja.

/** Esporte determina o denominador de intensidade e o vocabulário de alvo. */
export type Sport = 'run' | 'bike' | 'swim';

/** Papel estrutural do bloco. Ortogonal à zona: um aquecimento pode terminar em Z3. */
export type BlockKind =
  | 'warmup'
  | 'work'
  | 'recovery'   // recuperação ativa DENTRO de uma série
  | 'rest'       // pausa entre séries / parado
  | 'steady'     // bloco contínuo do corpo principal
  | 'cooldown';

export type ZoneKey = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';

/**
 * Alvo prescrito. União discriminada — cada esporte prescreve na sua moeda, e o
 * componente nunca precisa adivinhar qual é qual a partir de string.
 */
export type BlockTarget =
  | { kind: 'ftpPct';  from: number; to?: number }
  | { kind: 'powerW';  from: number; to?: number }
  | { kind: 'hrPct';   from: number; to?: number; basis: 'max' | 'reserve' | 'threshold' }
  | { kind: 'pace';    fromSecPerKm: number; toSecPerKm?: number }
  | { kind: 'pace100'; fromSecPer100m: number; toSecPer100m?: number }
  | { kind: 'rpe';     value: number }
  | { kind: 'none' };

/** Confiança na zona. Governa se o bloco pode ser desenhado com altura real. */
export type IntensityConfidence =
  | 'prescribed'  // alvo numérico + limiar do atleta
  | 'derived'     // inferido de tipoEtapa/texto — heurística, e declarada como tal
  | 'unknown';    // sem base; altura neutra e hachurada

export interface RampSpec {
  /** Intensidade normalizada no início e no fim do bloco (0..1). */
  fromNormalized: number;
  toNormalized: number;
}

export interface RepeatSpec {
  /** Identificador do grupo (mapeia `blocoId` do backend, ou o índice do bloco no editor). */
  groupId: string;
  /** 1-based: esta é a repetição `index` de `total`. */
  index: number;
  total: number;
}

export interface ProfileBlock {
  id: string;
  /** Posição no eixo X, 0-based, densa e sem buracos. */
  order: number;
  kind: BlockKind;

  /** Segundos, não minutos — blocos de 30s são de primeira classe. */
  durationSec: number;

  /** Nome completo, como o treinador escreveria. */
  label: string;
  /** Abreviação de no máximo 5 caracteres, declarada — nunca derivada por corte. */
  shortLabel?: string;

  target: BlockTarget;

  /** Altura. 0..1 relativo ao teto da escala. */
  intensityNormalized: number;
  zone: ZoneKey;
  confidence: IntensityConfidence;

  /** Presente só em aquecimento/desaquecimento e rampas explícitas. */
  ramp?: RampSpec;
  /** Presente quando o bloco pertence a uma série repetida. */
  repeat?: RepeatSpec;

  /** Texto auxiliar do tooltip. Nunca renderizado dentro do bloco. */
  note?: string;
}

export interface ZoneShare {
  zone: ZoneKey;
  seconds: number;
  /** 0..1. A soma sobre todas as zonas é 1 ± 0.005. */
  share: number;
}

/** Distribuição por papel estrutural — o que substitui a de zona no modo degradado. */
export interface KindShare {
  kind: BlockKind;
  seconds: number;
  share: number;
}

export interface ProfileMetrics {
  totalDurationSec: number;
  blockCount: number;
  /** Maior zona com ≥15% do tempo total. `null` quando nenhuma alcança. */
  targetZone: ZoneKey | null;
  targetZoneSeconds: number;
  /** Distribuição completa, aquecimento e desaquecimento inclusos. Soma 100%. */
  distribution: ZoneShare[];
  /** Só no modo degradado, onde falar em zona seria afirmar o que não se sabe. */
  kindDistribution?: KindShare[];
  /** Maior bloco contínuo em Z3+ — proxy de "quanto de trabalho real tem aqui". */
  longestWorkBlockSec: number;
  /**
   * Razão trabalho:recuperação, calculada DENTRO das séries quando existe pelo
   * menos uma; global caso contrário. `null` sem recuperação. Dentro da série é
   * como o treinador enuncia o treino — "3 por 2" —, e é a leitura que muda a
   * decisão; a razão global de um longo com sprint final não diz nada.
   */
  workToRecoveryRatio: number | null;
  /** Vêm do consumidor, não são derivados. `null` quando ausentes. */
  intensityFactor: number | null;
  tss: number | null;
}

export interface IntensityScale {
  metric: 'ftpPct' | 'hrPct' | 'pacePct' | 'rpe';
  /**
   * Teto da escala, fixo por métrica. É o que torna dois treinos diferentes
   * comparáveis lado a lado — normalizar pelo pico do próprio treino faria todo
   * treino parecer igualmente intenso.
   */
  ceiling: number;
  /** Limiares normalizados (0..1) que separam Z1|Z2, Z2|Z3, Z3|Z4, Z4|Z5. */
  zoneBreaks: [number, number, number, number];
}

export interface WorkoutProfile {
  sport: Sport;
  scale: IntensityScale;
  blocks: ProfileBlock[];
  metrics: ProfileMetrics;
  /** Montado sem prescrição confiável — a altura codifica papel, não intensidade. */
  degraded: boolean;
  /**
   * Etapas descartadas por não ter duração utilizável. Viram um aviso no header.
   * O componente antigo desenhava barra de largura zero: invisível e silencioso,
   * então o treinador não sabia que faltava dado.
   */
  droppedBlocks: number;
}
