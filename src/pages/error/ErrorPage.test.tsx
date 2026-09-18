import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ErrorPage } from './ErrorPage';

function renderRota(initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: '/coach/inbox', element: <div>inbox</div> },
      { path: '/coach/quebra', element: <QuebraDeRender />, errorElement: <ErrorPage /> },
      { path: '*', element: <ErrorPage kind="not-found" /> },
    ],
    { initialEntries: [initialPath] },
  );
  return render(<RouterProvider router={router} />);
}

function QuebraDeRender(): never {
  throw new Error('falha proposital de render');
}

describe('ErrorPage', () => {
  it('rota inexistente (catch-all) mostra mensagem de página não encontrada', () => {
    renderRota('/coach/rota-que-nao-existe');

    expect(screen.getByText(/página não encontrada/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar ao inbox/i })).toHaveAttribute('href', '/coach/inbox');
  });

  it('erro de render (errorElement) mostra mensagem genérica, não a tela default do React Router', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderRota('/coach/quebra');

    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    expect(screen.queryByText(/unexpected application error/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar ao inbox/i })).toBeInTheDocument();

    spy.mockRestore();
  });
});
