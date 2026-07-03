// Setup global do Vitest (jsdom).
// Adiciona os matchers do jest-dom (toBeInTheDocument, toHaveTextContent, etc.)
// e limpa o DOM entre os testes.
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom não implementa scrollIntoView; componentes que fazem auto-scroll (ex.: WeeklyPlanList)
// o chamam em efeitos de montagem. Stub global evita ruído nos testes de componente.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

afterEach(() => {
  cleanup();
});
