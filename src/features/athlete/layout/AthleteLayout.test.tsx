import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

/**
 * Banner de instalação do PWA (add-athlete-pwa-installable, task 1.6): montado no shell do atleta,
 * logo acima da barra de navegação, só quando o navegador ofereceu o prompt.
 */
describe('AthleteLayout — banner de instalação', () => {
  function dispararBeforeInstallPrompt() {
    const evento = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    };
    evento.prompt = vi.fn().mockResolvedValue(undefined);
    evento.userChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    act(() => {
      window.dispatchEvent(evento);
    });
  }

  it('sem o evento do navegador, não há banner', () => {
    renderLayout();
    expect(screen.queryByText('Instalar o Menthoros na tela inicial')).not.toBeInTheDocument();
  });

  it('com o evento, o banner aparece acima da barra de navegação', () => {
    renderLayout();

    dispararBeforeInstallPrompt();

    const banner = screen.getByText('Instalar o Menthoros na tela inicial');
    const nav = screen.getByRole('navigation', { name: /navegação do atleta/i });
    expect(banner).toBeInTheDocument();
    // "Acima" no fluxo do documento: o banner precede a barra na ordem do DOM.
    expect(banner.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('"Agora não" some com o banner', async () => {
    const user = userEvent.setup();
    renderLayout();
    dispararBeforeInstallPrompt();

    await user.click(screen.getByRole('button', { name: 'Agora não' }));

    expect(screen.queryByText('Instalar o Menthoros na tela inicial')).not.toBeInTheDocument();
  });
});
