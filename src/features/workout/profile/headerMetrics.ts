// Métricas do header, na ordem em que o treinador pergunta por elas.

export type HeaderMetric = 'duration' | 'blocks' | 'targetZoneTime' | 'workRatio' | 'if' | 'tss';

/**
 * Ordem fixa: duração (a primeira pergunta de qualquer treinador), número de
 * blocos (complexidade), tempo na zona-alvo (quanto de treino de verdade tem
 * aqui), razão trabalho:recuperação (o caráter do intervalado) e, por último,
 * IF e TSS — que só aparecem quando o backend os manda.
 */
export const METRICAS_PADRAO: HeaderMetric[] = [
  'duration',
  'blocks',
  'targetZoneTime',
  'workRatio',
  'if',
  'tss',
];
