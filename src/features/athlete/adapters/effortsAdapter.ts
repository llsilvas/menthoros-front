import type { AthleteMelhorEsforco } from '../../../types/AthleteProgress';

export interface EffortRow {
  distanciaLabel: string;
  tempoFormatado: string;
  paceLabel: string;
}

export interface EffortsReading {
  rows: EffortRow[];
  integracaoConectada: boolean;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** "1796" -> "29:56"; "3619" -> "1:00:19" (sem zero à esquerda na hora, diferente de RecordRow). */
export function formatTempoEsforco(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  const mm = horas > 0 ? pad2(minutos) : String(minutos);
  return horas > 0 ? `${horas}:${mm}:${pad2(segs)}` : `${mm}:${pad2(segs)}`;
}

/** Mapeia `AthleteMelhorEsforco[]` para linhas de exibição com o tempo já formatado. */
export function buildEffortsReading(
  marcas: AthleteMelhorEsforco[],
  integracaoConectada: boolean,
): EffortsReading {
  return {
    rows: marcas.map((m) => ({
      distanciaLabel: m.distanciaLabel,
      tempoFormatado: formatTempoEsforco(m.tempoSegundos),
      paceLabel: m.paceLabel,
    })),
    integracaoConectada,
  };
}
