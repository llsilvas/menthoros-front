import type { AthleteZones } from '../../../types/AthleteProgress';

export interface ZoneDistributionPercent {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

/**
 * Converte a distribuição de zonas (segundos por zona) em percentual do total.
 * Retorna `null` quando `duracaoTotalSegundos` é zero (atleta sem treino com FC ainda) —
 * evita divisão por zero e deixa o caller exibir o estado vazio em vez de barras a 0%.
 */
export function buildZoneDistributionPercent(zones: AthleteZones): ZoneDistributionPercent | null {
  if (zones.duracaoTotalSegundos === 0) {
    return null;
  }

  const pct = (seg: number) => Math.round((seg / zones.duracaoTotalSegundos) * 100);

  return {
    z1: pct(zones.z1),
    z2: pct(zones.z2),
    z3: pct(zones.z3),
    z4: pct(zones.z4),
    z5: pct(zones.z5),
  };
}
