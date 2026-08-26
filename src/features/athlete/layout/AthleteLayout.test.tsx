import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createHashRouter, RouterProvider } from 'react-router';
import { useTheme } from '@mui/material/styles';
import AthleteLayout from './AthleteLayout';
import { AuthContext, type AuthContextData } from '../../../context/auth/authContext';

/** Lê a família resolvida pelo provider mais próximo — é o que qualquer `Typography` do shell usa. */
function ProbeFonte() {
  const theme = useTheme();
  return <span data-testid="familia">{String(theme.typography.fontFamily)}</span>;
}

function renderLayout() {
  const ctx: AuthContextData = {
    isAuthenticated: true,
    carregando: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  };
  const router = createHashRouter([
    { path: '/', element: <AthleteLayout />, children: [{ index: true, element: <ProbeFonte /> }] },
  ]);
  render(
    <AuthContext.Provider value={ctx}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

describe('AthleteLayout', () => {
  it('envolve as páginas no tema do atleta: a família padrão não é Syne', () => {
    renderLayout();
    const familia = screen.getByTestId('familia').textContent ?? '';
    expect(familia).toMatch(/Inter/);
    expect(familia).not.toMatch(/Syne/);
  });

  it('continua renderizando a barra de navegação', () => {
    renderLayout();
    expect(screen.getByRole('navigation', { name: /navegação do atleta/i })).toBeInTheDocument();
  });
});
