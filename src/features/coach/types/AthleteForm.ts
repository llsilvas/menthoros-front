import { primary, semantic } from '../../../shared/design-tokens';

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
