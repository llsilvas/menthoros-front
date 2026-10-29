import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConnectionCard } from './ConnectionCard';
import * as useConnectionHook from '../../../hooks/features/useConnection';
import { useConnectionCallbackResult } from '../../../hooks/features/useConnectionCallbackResult';
import { useAthleteWatchBrand } from '../hooks/useAthleteWatchBrand';

vi.mock('../../../hooks/features/useConnection');
vi.mock('../../../hooks/features/useConnectionCallbackResult');
vi.mock('../hooks/useAthleteWatchBrand');
// O guia da marca lê a flag; aqui o canal direto está ligado (o card Garmin só existe assim).
vi.mock('../../../config/env', () => ({ runtimeConfig: { garminHabilitado: true } }));

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockRefresh = vi.fn();

function stubHook(overrides: Partial<ReturnType<typeof useConnectionHook.useConnection>> = {}) {
  vi.mocked(useConnectionHook.useConnection).mockReturnValue({
    status: null,
    loading: false,
    error: null,
    connect: mockConnect,
    disconnect: mockDisconnect,
    refresh: mockRefresh,
    ...overrides,
  });
}

describe('ConnectionCard (Garmin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConnectionCallbackResult).mockReturnValue(null);
    vi.mocked(useAthleteWatchBrand).mockReturnValue({ marca: 'GARMIN', modelo: undefined, loading: false, error: null });
  });

  it('usa o hook da plataforma GARMIN e mostra "Conectar Garmin"', () => {
    stubHook({ status: { conectado: false } });

    render(<ConnectionCard plataforma="GARMIN" />);

    expect(useConnectionHook.useConnection).toHaveBeenCalledWith('GARMIN');
    expect(screen.getByRole('button', { name: 'Conectar Garmin' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /intervals/i })).not.toBeInTheDocument();
  });

  it('mostra o consentimento (Garmin + IA, dois links) antes do botão Conectar', () => {
    stubHook({ status: { conectado: false } });

    render(<ConnectionCard plataforma="GARMIN" />);

    const linkGarmin = screen.getByRole('link', { name: /política de privacidade do Garmin/i });
    const linkMenthoros = screen.getByRole('link', { name: /política de privacidade do Menthoros/i });
    expect(linkGarmin).toHaveAttribute('href', 'https://www.garmin.com/privacy/connect');
    expect(linkMenthoros).toHaveAttribute('href', '/#/privacidade');
    expect(screen.getByText(/inteligência artificial/i)).toBeInTheDocument();

    const botao = screen.getByRole('button', { name: 'Conectar Garmin' });
    for (const link of [linkGarmin, linkMenthoros]) {
      expect(link.compareDocumentPosition(botao) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('o guia da marca Garmin não cita o intervals.icu', () => {
    stubHook({ status: { conectado: false } });

    render(<ConnectionCard plataforma="GARMIN" />);

    // As demais marcas ficam no acordeão (fechado, mas no DOM): o guia da marca atual vem primeiro.
    expect(screen.getAllByText('Em validação')[0]).toBeInTheDocument();
    expect(screen.getByText(/Autorize o Menthoros/)).toBeInTheDocument();
    expect(screen.queryByText(/Upload planned workouts/)).not.toBeInTheDocument();
  });

  it('conectado com as duas permissões: mostra o status e não avisa de permissão parcial', () => {
    stubHook({ status: { conectado: true, externalAthleteId: 'd331…4df8', workoutImport: true, activityExport: true } });

    render(<ConnectionCard plataforma="GARMIN" />);

    expect(screen.getByText(/d331…4df8/)).toBeInTheDocument();
    expect(screen.getByText(/Envio de treinos ao relógio/).textContent).toMatch(/autorizado/);
    expect(screen.queryByText(/não autorizado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reconecte e autorize/)).not.toBeInTheDocument();
  });

  it('permissão parcial (sem envio de treinos) avisa que o treino não chega ao relógio', () => {
    stubHook({ status: { conectado: true, externalAthleteId: 'd331…4df8', workoutImport: false, activityExport: true } });

    render(<ConnectionCard plataforma="GARMIN" />);

    expect(screen.getByText(/Envio de treinos ao relógio/).textContent).toMatch(/não autorizado/);
    expect(screen.getByText(/treino planejado não chega ao seu relógio/)).toBeInTheDocument();
  });

  it('permissão parcial (sem leitura das atividades) avisa que o realizado não volta', () => {
    stubHook({ status: { conectado: true, externalAthleteId: 'd331…4df8', workoutImport: true, activityExport: false } });

    render(<ConnectionCard plataforma="GARMIN" />);

    expect(screen.getByText(/treinos realizados não voltam/)).toBeInTheDocument();
  });

  it('lastSyncError aparece com a ação de reconectar a conta do Garmin', () => {
    stubHook({
      status: { conectado: true, externalAthleteId: 'x', workoutImport: true, activityExport: true, ultimoErro: 'Autorização revogada' },
    });

    render(<ConnectionCard plataforma="GARMIN" />);

    expect(screen.getByText(/Autorização revogada — reconecte sua conta do Garmin/)).toBeInTheDocument();
  });

  it.each([
    ['success', /conta do garmin conectada/i, true],
    ['denied', /você não autorizou o acesso no garmin/i, false],
    ['error', /não foi possível concluir a conexão/i, false],
  ] as const)('retorno do callback %s', (resultado, texto, revalida) => {
    vi.mocked(useConnectionCallbackResult).mockReturnValue(resultado);
    stubHook({ status: { conectado: false } });

    render(<ConnectionCard plataforma="GARMIN" />);

    expect(screen.getByText(texto)).toBeInTheDocument();
    expect(mockRefresh.mock.calls.length > 0).toBe(revalida);
  });

  it('desconectar pede confirmação e depois chama disconnect', async () => {
    mockDisconnect.mockResolvedValue(undefined);
    stubHook({ status: { conectado: true, externalAthleteId: 'x', workoutImport: true, activityExport: true } });
    const user = userEvent.setup();

    render(<ConnectionCard plataforma="GARMIN" />);

    await user.click(screen.getByRole('button', { name: /desconectar/i }));
    expect(mockDisconnect).not.toHaveBeenCalled();
    const dialogo = await screen.findByRole('dialog');
    expect(dialogo).toHaveTextContent(/Desconectar Garmin/);
    await user.click(within(dialogo).getByRole('button', { name: /confirmar/i }));

    expect(mockDisconnect).toHaveBeenCalledOnce();
  });
});
