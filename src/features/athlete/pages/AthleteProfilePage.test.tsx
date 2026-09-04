import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AthleteProfilePage from './AthleteProfilePage';
import { AuthContext, type AuthContextData } from '../../../context/auth/authContext';

vi.mock('../components/IntervalsIcuConnectionCard', () => ({ IntervalsIcuConnectionCard: () => <div>conexões</div> }));

function renderPage() {
  const ctx: AuthContextData = {
    isAuthenticated: true, carregando: false,
    login: vi.fn().mockResolvedValue(undefined), logout: vi.fn().mockResolvedValue(undefined),
  };
  render(<AuthContext.Provider value={ctx}><AthleteProfilePage /></AuthContext.Provider>);
  return ctx;
}

describe('AthleteProfilePage', () => {
  it('tem "Sair" com confirmação — a ação saiu da barra inferior', async () => {
    const ctx = renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(ctx.logout).not.toHaveBeenCalled();
    expect(screen.getByText('Sair da conta')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sair' }));
    expect(ctx.logout).toHaveBeenCalledTimes(1);
  });
});
