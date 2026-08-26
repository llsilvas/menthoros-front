import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AthleteBottomNav } from './AthleteBottomNav';
import { AuthContext, type AuthContextData } from '../../context/auth/authContext';

function renderNav(overrides: Partial<AuthContextData> = {}, unread = 0) {
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
      <AthleteBottomNav activeRoute="/athlete/home" onNavigate={onNavigate} unreadCoachMessages={unread} />
    </AuthContext.Provider>,
  );

  return { onNavigate, ctx };
}

describe('AthleteBottomNav', () => {
  it('mostra só os cinco destinos — "Sair" vive no Perfil', () => {
    renderNav();

    ['Hoje', 'Plano', 'Progresso', 'Coach', 'Perfil'].forEach((rotulo) => {
      expect(screen.getByRole('button', { name: rotulo })).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
  });

  it('mostra o badge de mensagens não lidas no item Coach', () => {
    renderNav({}, 2);
    expect(screen.getByLabelText('2 mensagens não lidas')).toHaveTextContent('2');
  });

  it('navega ao tocar num destino', async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderNav();

    await user.click(screen.getByRole('button', { name: 'Plano' }));

    expect(onNavigate).toHaveBeenCalledWith('/athlete/plan');
  });


  it('marca só a rota ativa como página atual', () => {
    renderNav();

    expect(screen.getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Plano' })).not.toHaveAttribute('aria-current');
  });
});
