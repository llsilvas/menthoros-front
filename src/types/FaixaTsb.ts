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

export type MetricTone = 'neutral' | 'success' | 'warning' | 'danger';

// ── Apresentação das faixas resolvidas pelo backend (FaixaTsb) ──────────────────
// O backend resolve a faixa a partir do TSB; aqui só mapeamos faixa → label/tom
// (presentation, sem limiares numéricos). 9 rótulos distintos, 4 tons.
// Tom por severidade: fadiga alta/crítica → danger; fadiga moderada/acumulando e
// MUITO_DESCANSADO → warning (este por risco de detraining/overtaper, não por
// estar "ruim"); fatigado/recuperando → neutral; forma ideal/descansado → success.
// Compartilhado entre as shells coach e athlete — não é vocabulário exclusivo do coach.

export interface FaixaApresentacao {
  label: string;
  tone: MetricTone;
}

export const FAIXA_APRESENTACAO: Record<FaixaTsbStatus, FaixaApresentacao> = {
  FADIGA_EXCESSIVA:  { label: 'Fadiga excessiva',  tone: 'danger'  },
  FADIGA_ALTA:       { label: 'Fadiga alta',       tone: 'danger'  },
  FADIGA_MODERADA:   { label: 'Fadiga moderada',   tone: 'warning' },
  ACUMULANDO_FADIGA: { label: 'Acumulando fadiga', tone: 'warning' },
  FATIGADO:          { label: 'Fatigado',          tone: 'neutral' },
  RECUPERANDO:       { label: 'Recuperando',       tone: 'neutral' },
  FORMA_IDEAL:       { label: 'Forma ideal',       tone: 'success' },
  DESCANSADO:        { label: 'Descansado',        tone: 'success' },
  MUITO_DESCANSADO:  { label: 'Muito descansado',  tone: 'warning' },
};
