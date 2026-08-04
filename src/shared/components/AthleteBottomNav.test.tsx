import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AthleteBottomNav } from './AthleteBottomNav';
import { AuthContext, type AuthContextData } from '../../context/auth/authContext';

function renderNav(overrides: Partial<AuthContextData> = {}) {
  const onNavigate = vi.fn();
  const ctx: AuthContextData = {
    isAuthenticated: true,
    carregando: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  render(
    <AuthContext.Provider value={ctx}>
      <AthleteBottomNav activeRoute="/athlete/home" onNavigate={onNavigate} />
    </AuthContext.Provider>,
  );

  return { onNavigate, ctx };
}

describe('AthleteBottomNav', () => {
  it('mostra os cinco destinos e a ação de sair', () => {
    renderNav();

    ['Hoje', 'Plano', 'Progresso', 'Coach', 'Perfil', 'Sair'].forEach((rotulo) => {
      expect(screen.getByRole('button', { name: rotulo })).toBeInTheDocument();
    });
  });

  it('navega ao tocar num destino', async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderNav();

    await user.click(screen.getByRole('button', { name: 'Plano' }));

    expect(onNavigate).toHaveBeenCalledWith('/athlete/plan');
  });

  /**
   * "Sair" divide a barra com destinos de navegação, mas **não é um destino**. Chamar `onNavigate`
   * aqui tentaria rotear para `null` — e, pior, sairia sem confirmação num toque acidental, que é o
   * risco real de colocar a ação numa barra de seis alvos em ~375px.
   */
  it('sair não navega: pede confirmação', async () => {
    const user = userEvent.setup();
    const { onNavigate, ctx } = renderNav();

    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(onNavigate).not.toHaveBeenCalled();
    expect(ctx.logout).not.toHaveBeenCalled();
    expect(screen.getByText('Sair da conta')).toBeInTheDocument();
  });

  it('desloga ao confirmar', async () => {
    const user = userEvent.setup();
    const { ctx } = renderNav();

    await user.click(screen.getByRole('button', { name: 'Sair' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sair' }));

    expect(ctx.logout).toHaveBeenCalledTimes(1);
  });

  // Leitor de tela não pode anunciar "Sair" como página atual — ele não é uma rota.
  it('não marca a ação de sair como página atual', () => {
    renderNav();

    expect(screen.getByRole('button', { name: 'Sair' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page');
  });
});
