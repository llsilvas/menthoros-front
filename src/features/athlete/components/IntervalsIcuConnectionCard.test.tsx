import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { IntervalsIcuConnectionCard } from './IntervalsIcuConnectionCard';
import * as useIntervalsIcuConnectionHook from '../../../hooks/features/useIntervalsIcuConnection';
import { useIntervalsIcuCallbackResult } from '../../../hooks/features/useIntervalsIcuCallbackResult';

vi.mock('../../../hooks/features/useIntervalsIcuConnection');
vi.mock('../../../hooks/features/useIntervalsIcuCallbackResult');

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockRefresh = vi.fn();
const mockCallbackResult = vi.mocked(useIntervalsIcuCallbackResult);

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
    // Sem retorno de callback é o estado normal da tela; os testes do retorno sobrescrevem.
    mockCallbackResult.mockReturnValue(null);
  });

  // O fluxo de API key foi removido: conectar agora é um clique que leva ao consentimento no
  // provedor. Não há mais nada para o atleta gerar, copiar ou digitar.
  it('desconectado mostra o botão de conectar, sem campo de API key', () => {
    stubHook({ status: { conectado: false } });

    render(<IntervalsIcuConnectionCard />);

    expect(screen.getByRole('button', { name: /conectar com intervals\.icu/i })).toBeEnabled();
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
  });

  it('chama connect sem argumento ao clicar em Conectar', async () => {
    mockConnect.mockResolvedValue(undefined);
    stubHook({ status: { conectado: false } });
    const user = userEvent.setup();

    render(<IntervalsIcuConnectionCard />);

    await user.click(screen.getByRole('button', { name: /conectar com intervals\.icu/i }));

    await waitFor(() => expect(mockConnect).toHaveBeenCalledWith());
  });

  it('desabilita o botão enquanto carrega', () => {
    stubHook({ status: { conectado: false }, loading: true });

    render(<IntervalsIcuConnectionCard />);

    expect(screen.getByRole('button')).toBeDisabled();
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
    // A orientação mudou junto com o fluxo: não há mais key para gerar, só reconectar.
    expect(screen.getByText(/reconecte sua conta/i)).toBeInTheDocument();
  });

  describe('retorno do callback OAuth2', () => {
    it('mostra confirmação e revalida o status quando volta com success', async () => {
      mockCallbackResult.mockReturnValue('success');
      stubHook({ status: { conectado: false } });

      render(<IntervalsIcuConnectionCard />);

      expect(screen.getByText(/conta do intervals\.icu conectada/i)).toBeInTheDocument();
      // Sem o refresh, o atleta autorizaria com sucesso e continuaria vendo o botão "Conectar":
      // o status em memória é o de antes de ele sair da página.
      await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    });

    it('mostra orientação e não revalida quando volta com error', async () => {
      mockCallbackResult.mockReturnValue('error');
      stubHook({ status: { conectado: false } });

      render(<IntervalsIcuConnectionCard />);

      expect(screen.getByText(/não foi possível concluir a conexão/i)).toBeInTheDocument();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    // O motivo da falha não viaja na URL de propósito (ela fica na barra e no histórico), então
    // a mensagem orienta a ação em vez de diagnosticar.
    it('não expõe detalhe técnico na mensagem de erro do callback', () => {
      mockCallbackResult.mockReturnValue('error');
      stubHook({ status: { conectado: false } });

      render(<IntervalsIcuConnectionCard />);

      const alerta = screen.getByText(/não foi possível concluir a conexão/i);
      expect(alerta.textContent).not.toMatch(/state|token|code|401|500/i);
    });

    it('sem retorno na URL não mostra nenhum dos dois alertas', () => {
      mockCallbackResult.mockReturnValue(null);
      stubHook({ status: { conectado: false } });

      render(<IntervalsIcuConnectionCard />);

      expect(screen.queryByText(/conta do intervals\.icu conectada/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/não foi possível concluir/i)).not.toBeInTheDocument();
    });
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
