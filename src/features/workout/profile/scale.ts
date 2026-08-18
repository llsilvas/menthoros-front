// Escala de intensidade: o esporte não muda o desenho, muda o denominador do
// eixo Y (spec §2.3 e §4.2).
//
// O teto é FIXO por métrica, não o pico do treino. É o que permite pôr dois
// treinos lado a lado e ler a diferença: normalizado pelo próprio pico, um
// regenerativo de 40min e um 5×3' no limiar desenhariam a mesma altura máxima.

import type { IntensityScale, Sport, ZoneKey } from './types';

export interface AthleteThresholds {
  ftpWatts?: number;
  paceLimiarSecPerKm?: number;
  cssSecPer100m?: number;
  fcMax?: number;
}

/**
 * Cortes das 5 zonas, na unidade de cada métrica, antes de normalizar.
 * O modelo de 5 zonas é o de Coggan, ancorado no limiar (100% = limiar).
 */
const CORTES: Record<IntensityScale['metric'], [number, number, number, number]> = {
  // % do limiar (FTP ou velocidade no limiar): Z1 ≤60 · Z2 61–82 · Z3 83–97 · Z4 98–110 · Z5 >110
  ftpPct:  [60, 82, 97, 110],
  pacePct: [60, 82, 97, 110],
  // % da FCmáx: o limiar cai por volta de 94–95% da máxima, então os cortes
  // ficam comprimidos no topo — não é a mesma escala com outro rótulo.
  hrPct:   [68, 83, 94, 105],
  // Percepção de esforço 1–10.
  rpe:     [3, 5, 6, 8],
};

const TETO: Record<IntensityScale['metric'], number> = {
  ftpPct:  150,
  pacePct: 150,
  hrPct:   110,
  rpe:     10,
};

function escala(metric: IntensityScale['metric']): IntensityScale {
  const ceiling = TETO[metric];
  const [a, b, c, d] = CORTES[metric];
  return {
    metric,
    ceiling,
    zoneBreaks: [a / ceiling, b / ceiling, c / ceiling, d / ceiling],
  };
}

/**
 * Escolhe a métrica pelo limiar disponível, degradando em ordem declarada:
 * limiar do esporte → FCmáx → RPE. Cada degrau é uma perda de precisão real, e
 * é o `confidence` do bloco que a comunica — a escala não finge.
 */
export function scaleFor(sport: Sport, thresholds?: AthleteThresholds): IntensityScale {
  const t = thresholds ?? {};

  if (sport === 'bike' && t.ftpWatts) return escala('ftpPct');
  if (sport === 'run' && t.paceLimiarSecPerKm) return escala('pacePct');
  if (sport === 'swim' && t.cssSecPer100m) return escala('pacePct');
  if (t.fcMax) return escala('hrPct');

  return escala('rpe');
}

/** Converte um valor na unidade da métrica para 0..1 sobre o teto. */
export function normalize(valor: number, scale: IntensityScale): number {
  return Math.min(1, Math.max(0, valor / scale.ceiling));
}

/**
 * Zona a partir da intensidade normalizada. Os limites são inclusivos à
 * esquerda: 0.40 já é Z2, e é assim que a tabela da spec lê.
 */
export function zoneOf(intensityNormalized: number, scale: IntensityScale): ZoneKey {
  const [z1, z2, z3, z4] = scale.zoneBreaks;
  if (intensityNormalized < z1) return 'Z1';
  if (intensityNormalized < z2) return 'Z2';
  if (intensityNormalized < z3) return 'Z3';
  if (intensityNormalized < z4) return 'Z4';
  return 'Z5';
}

/** Ponto médio da faixa de uma zona — a altura nominal de um bloco só com zona. */
export function midpointOf(zone: ZoneKey, scale: IntensityScale): number {
  const [z1, z2, z3, z4] = scale.zoneBreaks;
  switch (zone) {
    case 'Z1': return z1 / 2;
    case 'Z2': return (z1 + z2) / 2;
    case 'Z3': return (z2 + z3) / 2;
    case 'Z4': return (z3 + z4) / 2;
    case 'Z5': return (z4 + 1) / 2;
  }
}
