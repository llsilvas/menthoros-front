import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { IntervalsIcuConnectionCard } from './IntervalsIcuConnectionCard';
import * as useIntervalsIcuConnectionHook from '../../../hooks/features/useIntervalsIcuConnection';

vi.mock('../../../hooks/features/useIntervalsIcuConnection');

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockRefresh = vi.fn();

function stubHook(overrides: Partial<ReturnType<typeof useIntervalsIcuConnectionHook.useIntervalsIcuConnection>> = {}) {
  vi.mocked(useIntervalsIcuConnectionHook.useIntervalsIcuConnection).mockReturnValue({
    status: null,
    loading: false,
    error: null,
    connect: mockConnect,
    disconnect: mockDisconnect,
    refresh: mockRefresh,
    ...overrides,
  });
}

describe('IntervalsIcuConnectionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza input de API key e botão Conectar desabilitado quando desconectado e input vazio', () => {
    stubHook({ status: { conectado: false } });

    render(<IntervalsIcuConnectionCard />);

    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /conectar/i })).toBeDisabled();
    expect(screen.getByRole('link', { name: /intervals\.icu\/settings|settings/i })).toHaveAttribute(
      'href',
      'https://intervals.icu/settings'
    );
  });

  it('chama connect com a key digitada ao clicar em Conectar', async () => {
    mockConnect.mockResolvedValue(true);
    stubHook({ status: { conectado: false } });
    const user = userEvent.setup();

    render(<IntervalsIcuConnectionCard />);

    await user.type(screen.getByLabelText(/api key/i), 'minha-chave-secreta');
    await user.click(screen.getByRole('button', { name: /conectar/i }));

    await waitFor(() => expect(mockConnect).toHaveBeenCalledWith('minha-chave-secreta'));
  });

  it('exibe a mensagem de erro do hook em um Alert de erro (nunca texto genérico)', () => {
    stubHook({ status: { conectado: false }, error: 'API key inválida ou expirada' });

    render(<IntervalsIcuConnectionCard />);

    expect(screen.getByText('API key inválida ou expirada')).toBeInTheDocument();
  });

  it('estado conectado mostra o external id e o botão Desconectar', () => {
    stubHook({
      status: {
        conectado: true,
        externalAthleteId: 'i123456',
        conectadoEm: '2026-07-01T10:00:00Z',
      },
    });

    render(<IntervalsIcuConnectionCard />);

    expect(screen.getByText(/i123456/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desconectar/i })).toBeInTheDocument();
  });

  it('exibe ultimoErro em Alert warning com ação sugerida quando presente', () => {
    stubHook({
      status: {
        conectado: true,
        externalAthleteId: 'i123456',
        conectadoEm: '2026-07-01T10:00:00Z',
        ultimoErro: 'Falha ao enviar treino: 401 Unauthorized',
      },
    });

    render(<IntervalsIcuConnectionCard />);

    expect(screen.getByText(/Falha ao enviar treino: 401 Unauthorized/)).toBeInTheDocument();
    expect(screen.getByText(/gere uma nova key.*reconecte/i)).toBeInTheDocument();
  });

  it('exibe o erro do hook no ramo conectado (falha no disconnect não é silenciosa)', () => {
    stubHook({
      status: {
        conectado: true,
        externalAthleteId: 'i123456',
        conectadoEm: '2026-07-01T10:00:00Z',
      },
      error: 'Erro ao desconectar intervals.icu',
    });

    render(<IntervalsIcuConnectionCard />);

    expect(screen.getByText('Erro ao desconectar intervals.icu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desconectar/i })).toBeInTheDocument();
  });

  it('pede confirmação antes de desconectar e só chama disconnect após confirmar', async () => {
    mockDisconnect.mockResolvedValue(undefined);
    stubHook({
      status: {
        conectado: true,
        externalAthleteId: 'i123456',
        conectadoEm: '2026-07-01T10:00:00Z',
      },
    });
    const user = userEvent.setup();

    render(<IntervalsIcuConnectionCard />);

    await user.click(screen.getByRole('button', { name: /desconectar/i }));
    expect(mockDisconnect).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => expect(mockDisconnect).toHaveBeenCalledOnce());
  });
});
