import type { TreinoRealizadoDto, TipoTreino } from '../../../types/TreinoManual';
import { TIPO_TREINO_LABELS } from '../../../types/TreinoManual';
import { parseDuracaoMin } from './parseDuracaoMin';

export interface PostWorkoutFeedback {
  tipoLabel: string;
  duracaoLabel: string | null;
  distanciaLabel: string | null;
  tssLabel: string | null;
  mensagem: string;
}

const TIPO_TREINO_EMOJI: Partial<Record<TipoTreino, string>> = {
  CONTINUO: '🏃',
  INTERVALADO: '⚡',
  FARTLEK: '🔀',
  REGENERATIVO: '🌱',
  TREINO_LONGO: '🏔️',
  HILL_REPEAT: '⛰️',
  STRIDES: '💨',
  TRAIL: '🌲',
};

const MENSAGEM_ESFORCO_ALTO = 'Grande esforço! Respeite a recuperação.';
const MENSAGEM_ESFORCO_BAIXO = 'Bom treino leve! Ativação no ponto.';
const MENSAGEM_DEFAULT = 'Bom treino! Mantenha a consistência.';

function buildMensagem(percepcaoEsforco: number | undefined): string {
  if (percepcaoEsforco == null) return MENSAGEM_DEFAULT;
  if (percepcaoEsforco >= 8) return MENSAGEM_ESFORCO_ALTO;
  if (percepcaoEsforco <= 4) return MENSAGEM_ESFORCO_BAIXO;
  return MENSAGEM_DEFAULT;
}

/**
 * Monta o feedback pós-treino determinístico (sem IA) a partir do treino recém-registrado.
 * Nunca fabrica um campo ausente/malformado — omite a linha correspondente.
 */
export function buildPostWorkoutFeedback(treino: TreinoRealizadoDto): PostWorkoutFeedback {
  const label = TIPO_TREINO_LABELS[treino.tipoTreino] ?? treino.tipoTreino;
  const emoji = TIPO_TREINO_EMOJI[treino.tipoTreino];
  const tipoLabel = emoji ? `${emoji} ${label}` : label;

  const minutos = parseDuracaoMin(treino.duracaoMin);
  const duracaoLabel = minutos != null ? `${minutos} min` : null;

  const distanciaLabel = treino.distanciaKm ? `${treino.distanciaKm.toFixed(1)} km` : null;

  const tssLabel = treino.tssCalculado != null ? `TSS ${treino.tssCalculado}` : null;

  return {
    tipoLabel,
    duracaoLabel,
    distanciaLabel,
    tssLabel,
    mensagem: buildMensagem(treino.percepcaoEsforco),
  };
}
