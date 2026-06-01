import { useEffect } from 'react';

const LIME_COLOR_RGB = 'rgb(212, 255, 58)'; // #D4FF3A
const LIME_LIMIT = 8;

/**
 * Dev-only hook: emite warning se mais de 8 elementos usando a cor lime
 * (primary[500] = #D4FF3A) estiverem visíveis no viewport.
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

    // Estratégia 2: elementos com computed color ou background exatamente igual ao lime canônico
    const allElements = document.querySelectorAll('*');
    let computedCount = 0;
    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (
        style.color === LIME_COLOR_RGB ||
        style.backgroundColor === LIME_COLOR_RGB ||
        style.borderColor === LIME_COLOR_RGB
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
