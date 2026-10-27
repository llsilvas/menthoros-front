import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AthleteProfilePage from './AthleteProfilePage';
import { AuthContext, type AuthContextData } from '../../../context/auth/authContext';
import { useAthleteWatchBrand } from '../hooks/useAthleteWatchBrand';
import type { DispositivoMarca } from '../../../types/Onboarding';

const config = vi.hoisted(() => ({ garminHabilitado: false }));

vi.mock('../components/ConnectionCard', () => ({
  ConnectionCard: ({ plataforma }: { plataforma: string }) => <div>conexões:{plataforma}</div>,
}));
vi.mock('../hooks/useAthleteWatchBrand');
vi.mock('../../../config/env', () => ({ runtimeConfig: config }));

function stubMarca(marca: DispositivoMarca | undefined, loading = false) {
  vi.mocked(useAthleteWatchBrand).mockReturnValue({ marca, modelo: undefined, loading, error: null });
}

function renderPage() {
  const ctx: AuthContextData = {
    isAuthenticated: true, carregando: false,
    login: vi.fn().mockResolvedValue(undefined), logout: vi.fn().mockResolvedValue(undefined),
  };
  render(<AuthContext.Provider value={ctx}><AthleteProfilePage /></AuthContext.Provider>);
  return ctx;
}

describe('AthleteProfilePage', () => {
  beforeEach(() => {
    config.garminHabilitado = false;
    stubMarca(undefined);
  });

  it('tem "Sair" com confirmação — a ação saiu da barra inferior', async () => {
    const ctx = renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(ctx.logout).not.toHaveBeenCalled();
    expect(screen.getByText('Sair da conta')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sair' }));
    expect(ctx.logout).toHaveBeenCalledTimes(1);
  });

  // CA11: a marca só escolhe o canal com o Garmin direto habilitado.
  it.each([
    [true, 'GARMIN', 'GARMIN'],
    [false, 'GARMIN', 'INTERVALS_ICU'],
    [true, 'COROS', 'INTERVALS_ICU'],
    [true, undefined, 'INTERVALS_ICU'],
  ] as const)('flag=%s marca=%s -> card %s', (flag, marca, esperado) => {
    config.garminHabilitado = flag;
    stubMarca(marca);

    renderPage();

    expect(screen.getByText(`conexões:${esperado}`)).toBeInTheDocument();
  });

  it('com a flag ligada, espera a marca carregar em vez de piscar o card do intervals.icu', () => {
    config.garminHabilitado = true;
    stubMarca(undefined, true);

    renderPage();

    expect(screen.queryByText(/conexões:/)).not.toBeInTheDocument();
  });

  it('com a flag desligada, não espera a marca', () => {
    stubMarca(undefined, true);

    renderPage();

    expect(screen.getByText('conexões:INTERVALS_ICU')).toBeInTheDocument();
  });
});
