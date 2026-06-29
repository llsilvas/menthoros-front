/**
 * Faixas de forma resolvidas pelo backend a partir do TSB (enum `FaixaTsb`).
 * O backend é a fonte única da classificação; a UI só apresenta o valor recebido.
 */
export type FaixaTsbStatus =
  | 'FADIGA_EXCESSIVA'
  | 'FADIGA_ALTA'
  | 'FADIGA_MODERADA'
  | 'ACUMULANDO_FADIGA'
  | 'FATIGADO'
  | 'RECUPERANDO'
  | 'FORMA_IDEAL'
  | 'DESCANSADO'
  | 'MUITO_DESCANSADO';
