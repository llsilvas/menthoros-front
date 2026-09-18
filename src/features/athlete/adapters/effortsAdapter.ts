import type { AthleteMelhorEsforco } from '../../../types/AthleteProgress';
import { formatDuracaoEsforco } from '../../../utils/duration';

export interface EffortRow {
  distanciaLabel: string;
  tempoFormatado: string;
  paceLabel: string;
}

export interface EffortsReading {
  rows: EffortRow[];
  integracaoConectada: boolean;
}

/** Mapeia `AthleteMelhorEsforco[]` para linhas de exibição com o tempo já formatado. */
export function buildEffortsReading(
  marcas: AthleteMelhorEsforco[],
  integracaoConectada: boolean,
): EffortsReading {
  return {
    rows: marcas.map((m) => ({
      distanciaLabel: m.distanciaLabel,
      tempoFormatado: formatDuracaoEsforco(m.tempoSegundos),
      paceLabel: m.paceLabel,
    })),
    integracaoConectada,
  };
}
