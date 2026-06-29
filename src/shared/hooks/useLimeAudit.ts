import { useEffect } from 'react';
import { activeTheme } from '../../theme/activeTheme';

// Lime de marca ativo (primary[500]) decomposto em [r,g,b]. Derivado do tema
// ativo: premium-v2 troca #D4FF3A → #BDDE5A, então o audit segue a flag sem
// hex hardcoded. getComputedStyle reporta cor opaca como "rgb(r, g, b)".
const LIME_HEX = activeTheme.primary[500];
const LIME_RGB: [number, number, number] = [
  parseInt(LIME_HEX.slice(1, 3), 16),
  parseInt(LIME_HEX.slice(3, 5), 16),
  parseInt(LIME_HEX.slice(5, 7), 16),
];
const LIME_LIMIT = 8;

// True quando `value` (cor computada do browser) é o lime de marca opaco.
// Só conta opaco (3 componentes) — opacidades baixas não são "lime saturado".
function isOpaqueLime(value: string): boolean {
  const nums = value.match(/\d+/g);
  if (!nums || nums.length !== 3) return false;
  return (
    Number(nums[0]) === LIME_RGB[0] &&
    Number(nums[1]) === LIME_RGB[1] &&
    Number(nums[2]) === LIME_RGB[2]
  );
}

/**
 * Dev-only hook: emite warning se mais de 8 elementos usando a cor lime
 * (primary[500]) estiverem visíveis no viewport.
 *
 * No-op em produção. Adicione `data-lime="true"` a elementos que usam
 * primary[500] de forma saturada (não aplique a opacidades baixas).
 *
 * Uso:
 *   // Em qualquer componente de layout raiz (ex: App.tsx ou DashboardLayout)
 *   useLimeAudit();
 */
export function useLimeAudit(): void {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Estratégia 1: elementos marcados explicitamente com data-lime
    const markedElements = document.querySelectorAll('[data-lime="true"]');

    // Estratégia 2: elementos com computed color/background/border igual ao lime
    const allElements = document.querySelectorAll('*');
    let computedCount = 0;
    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (
        isOpaqueLime(style.color) ||
        isOpaqueLime(style.backgroundColor) ||
        isOpaqueLime(style.borderColor)
      ) {
        computedCount++;
      }
    });

    const total = Math.max(markedElements.length, computedCount);

    if (total > LIME_LIMIT) {
      console.warn(
        `[LimeAudit] ${total} elementos lime visíveis no viewport — limite recomendado: ${LIME_LIMIT}.\n` +
        'Revise quais elementos realmente precisam da cor brand lime (primary[500]).\n' +
        'Consulte a "Disciplina do Lime" em finalize-design-system-dark-first/spec.md.'
      );
    }
  });
}
