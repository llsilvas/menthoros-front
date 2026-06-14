// Setup global do Vitest (jsdom).
// Adiciona os matchers do jest-dom (toBeInTheDocument, toHaveTextContent, etc.)
// e limpa o DOM entre os testes.
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
