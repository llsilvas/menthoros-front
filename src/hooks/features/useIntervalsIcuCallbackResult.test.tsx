import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createHashRouter, RouterProvider } from 'react-router';
import { useIntervalsIcuCallbackResult } from './useIntervalsIcuCallbackResult';

/**
 * Monta sob um `createHashRouter` de verdade, e não `MemoryRouter`.
 *
 * O app usa hash router, e o parâmetro chega DENTRO do hash
 * (`/#/athlete/profile?intervals-icu=success`). Um `MemoryRouter` resolveria a rota em memória, e
 * o teste passaria mesmo se o código lesse o lugar errado — exatamente o falso verde que o
 * `CLAUDE.md` do módulo descreve.
 */
function Sonda() {
  const resultado = useIntervalsIcuCallbackResult();
  return <span data-testid="resultado">{resultado ?? 'nulo'}</span>;
}

function renderComHash(hashInicial: string) {
  // replaceState e não `window.location.hash = …`: a atribuição direta dispara `hashchange`, e
  // routers de testes já encerrados ainda ouvem o evento — cada um tentava navegar depois de
  // desmontado, produzindo unhandled rejections que sujavam a suíte inteira.
  window.history.replaceState(null, '', hashInicial);

  const router = createHashRouter([
    { path: '/athlete/profile', element: <Sonda /> },
    { path: '*', element: <Sonda /> },
  ]);

  return render(<RouterProvider router={router} />);
}

const lerResultado = () => screen.getByTestId('resultado').textContent;

describe('useIntervalsIcuCallbackResult', () => {
  it('lê success de dentro do hash', async () => {
    renderComHash('#/athlete/profile?intervals-icu=success');

    await waitFor(() => expect(lerResultado()).toBe('success'));
  });

  it('lê error de dentro do hash', async () => {
    renderComHash('#/athlete/profile?intervals-icu=error');

    await waitFor(() => expect(lerResultado()).toBe('error'));
  });

  it('devolve null quando não há parâmetro', async () => {
    renderComHash('#/athlete/profile');

    await waitFor(() => expect(lerResultado()).toBe('nulo'));
  });

  it('ignora valor desconhecido', async () => {
    renderComHash('#/athlete/profile?intervals-icu=talvez');

    await waitFor(() => expect(lerResultado()).toBe('nulo'));
  });

  // Sem a limpeza, um F5 depois de conectar mostraria "conectado com sucesso" de novo, sem que
  // nada tivesse acontecido.
  it('remove o parâmetro da URL depois de lido', async () => {
    renderComHash('#/athlete/profile?intervals-icu=success');

    await waitFor(() => expect(lerResultado()).toBe('success'));
    await waitFor(() => expect(window.location.hash).not.toContain('intervals-icu'));
  });

  // A limpeza não pode levar o atleta embora da tela do card.
  it('mantém a rota do perfil ao limpar o parâmetro', async () => {
    renderComHash('#/athlete/profile?intervals-icu=success');

    await waitFor(() => expect(window.location.hash).not.toContain('intervals-icu'));
    expect(window.location.hash).toContain('/athlete/profile');
  });
});
