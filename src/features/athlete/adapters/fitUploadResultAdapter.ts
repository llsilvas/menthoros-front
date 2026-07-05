import type { TreinoRealizadoDto } from '../../../types/TreinoManual';
import { parseDuracaoMin } from './parseDuracaoMin';

export interface FitUploadPreview {
  duracaoLabel: string | null;
  distanciaLabel: string | null;
  fcLabel: string | null;
  lapsLabel: string | null;
}

/**
 * Monta o preview determinístico do treino recém-importado de um .fit.
 * Nunca fabrica um campo ausente/malformado — omite a linha correspondente.
 */
export function buildFitUploadPreview(treino: TreinoRealizadoDto): FitUploadPreview {
  const minutos = parseDuracaoMin(treino.duracaoMin);
  const duracaoLabel = minutos != null ? `${minutos} min` : null;

  const distanciaLabel = treino.distanciaKm ? `${treino.distanciaKm.toFixed(1)} km` : null;

  const fcLabel = treino.fcMedia != null ? `FC média ${treino.fcMedia} bpm` : null;

  const numLaps = treino.etapasRealizadas?.length ?? 0;
  const lapsLabel = numLaps > 0 ? `${numLaps} ${numLaps === 1 ? 'lap' : 'laps'}` : null;

  return { duracaoLabel, distanciaLabel, fcLabel, lapsLabel };
}
