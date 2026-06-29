import { primary, semantic } from '../../../shared/design-tokens';
import type { FaixaTsbStatus } from '../../../types/FaixaTsb';

export type FormVariant =
  | 'form_excellent' // TSB >= 15  — primary-500 lime
  | 'form_good'      // TSB 5..14  — success-500 emerald
  | 'form_stable'    // TSB -10..4 — info-500 blue
  | 'form_low'       // TSB -20..-11 — warning-500 amber
  | 'form_critical'; // TSB < -20  — danger-500 red (alinhado com backend deriveStatus danger ≤ -20)

export const formVariantColor: Record<FormVariant, string> = {
  form_excellent: primary[500],
  form_good:      semantic.success[500],
  form_stable:    semantic.info[500],
  form_low:       semantic.warning[500],
  form_critical:  semantic.danger[500],
};

export const formVariantLabel: Record<FormVariant, string> = {
  form_excellent: 'Excelente',
  form_good:      'Boa',
  form_stable:    'Estável',
  form_low:       'Baixa',
  form_critical:  'Muito baixa',
};

export function formFromTSB(tsb: number): FormVariant {
  if (tsb >= 15)  return 'form_excellent';
  if (tsb >= 5)   return 'form_good';
  if (tsb >= -10) return 'form_stable';
  if (tsb >= -20) return 'form_low';
  return 'form_critical';
}

export type MetricTone = 'neutral' | 'success' | 'warning' | 'danger';

/** Mapeia a forma (variante de TSB) para o tom visual usado em tiles/métricas. */
export function getTsbFormaTone(forma: FormVariant): MetricTone {
  switch (forma) {
    case 'form_excellent':
    case 'form_good':
      return 'success';
    case 'form_stable':
      return 'neutral';
    case 'form_low':
      return 'warning';
    case 'form_critical':
      return 'danger';
  }
}

// ── Apresentação das faixas resolvidas pelo backend (FaixaTsb) ──────────────────
// O backend resolve a faixa a partir do TSB; aqui só mapeamos faixa → label/tom
// (presentation, sem limiares numéricos). 9 rótulos distintos, 4 tons.
// Tom por severidade: fadiga alta/crítica → danger; fadiga moderada/acumulando e
// MUITO_DESCANSADO → warning (este por risco de detraining/overtaper, não por
// estar "ruim"); fatigado/recuperando → neutral; forma ideal/descansado → success.

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
