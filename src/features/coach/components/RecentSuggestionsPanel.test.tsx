import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecentSuggestionsPanel } from './RecentSuggestionsPanel';
import { SugestaoService } from '../../../api/services/SugestaoService';
import { ApiError } from '../../../api/core/ApiError';
import type { SugestaoCoachOutputDto } from '../../../types/SugestaoCoach';
import type { SugestaoRecenteDto } from '../../../types/AtletaPerfilCoach';

vi.mock('../../../api/services/SugestaoService');

function makeDetail(overrides: Partial<SugestaoCoachOutputDto> = {}): SugestaoCoachOutputDto {
  return {
    id: 's1',
    atletaId: 'a1',
    athleteName: 'Ana Silva',
    tipo: 'PLAN_ADJUST',
    status: 'PENDING',
    confidence: 'HIGH',
    summary: 'Reduzir volume em 20%',
    createdAt: '2026-09-20T10:00:00Z',
    ...overrides,
  };
}

const SUGESTOES: SugestaoRecenteDto[] = [
  { id: 's1', tipo: 'AJUSTE_PLANO', status: 'PENDING', criadoEm: '2026-09-20T10:00:00Z' },
];

function apiError(status: number): ApiError {
  return new ApiError(
    { method: 'POST', url: '/api/v1/coach/sugestoes/s1/aprovar' } as never,
    { url: '/api/v1/coach/sugestoes/s1/aprovar', ok: false, status, statusText: 'Error', body: null } as never,
    'Erro',
  );
}

describe('RecentSuggestionsPanel — ações de decisão', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function abrirDialog() {
    render(<RecentSuggestionsPanel sugestoes={SUGESTOES} />);
    await userEvent.click(await screen.findByRole('button', { name: /^ver$/i }));
  }

  it('CA1: aprova uma sugestão PENDING e reflete o novo status no dialog', async () => {
    vi.mocked(SugestaoService.detalhe).mockResolvedValue(makeDetail());
    vi.mocked(SugestaoService.aprovar).mockResolvedValue(makeDetail({ status: 'APPROVED' }));
    const onDecisao = vi.fn();

    render(<RecentSuggestionsPanel sugestoes={SUGESTOES} onDecisao={onDecisao} />);
    await userEvent.click(await screen.findByRole('button', { name: /^ver$/i }));

    await userEvent.click(await screen.findByRole('button', { name: /aprovar/i }));

    await waitFor(() => expect(SugestaoService.aprovar).toHaveBeenCalledWith('s1'));
    expect(await screen.findByText('Aprovada')).toBeInTheDocument();
    expect(onDecisao).toHaveBeenCalled();
  });

  it('CA2: rejeitar pede confirmação (ação destrutiva) e só então reflete o novo status', async () => {
    vi.mocked(SugestaoService.detalhe).mockResolvedValue(makeDetail());
    vi.mocked(SugestaoService.rejeitar).mockResolvedValue(makeDetail({ status: 'REJECTED' }));
    const onDecisao = vi.fn();

    render(<RecentSuggestionsPanel sugestoes={SUGESTOES} onDecisao={onDecisao} />);
    await userEvent.click(await screen.findByRole('button', { name: /^ver$/i }));

    await userEvent.click(await screen.findByRole('button', { name: /^rejeitar$/i }));
    expect(SugestaoService.rejeitar).not.toHaveBeenCalled();

    await userEvent.click(await screen.findByRole('button', { name: /confirmar/i }));

    await waitFor(() => expect(SugestaoService.rejeitar).toHaveBeenCalledWith('s1'));
    expect(await screen.findByText('Rejeitada')).toBeInTheDocument();
    expect(onDecisao).toHaveBeenCalled();
  });

  it('CA2b: cancelar a confirmação de rejeição não chama o serviço', async () => {
    vi.mocked(SugestaoService.detalhe).mockResolvedValue(makeDetail());

    await abrirDialog();
    await userEvent.click(await screen.findByRole('button', { name: /^rejeitar$/i }));
    await userEvent.click(await screen.findByRole('button', { name: /cancelar/i }));

    expect(SugestaoService.rejeitar).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument());
  });

  it('CA3: resposta perdida após commit — reconsulta detalhe em vez de assumir PENDING', async () => {
    vi.mocked(SugestaoService.detalhe)
      .mockResolvedValueOnce(makeDetail())
      .mockResolvedValueOnce(makeDetail({ status: 'APPROVED' }));
    vi.mocked(SugestaoService.aprovar).mockRejectedValue(new TypeError('Network error'));

    await abrirDialog();
    await userEvent.click(await screen.findByRole('button', { name: /aprovar/i }));

    await waitFor(() => expect(SugestaoService.detalhe).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Aprovada')).toBeInTheDocument();
  });

  it('CA3 (reconsulta também falha): mostra mensagem de recarregar, não erro genérico', async () => {
    vi.mocked(SugestaoService.detalhe)
      .mockResolvedValueOnce(makeDetail())
      .mockRejectedValueOnce(new TypeError('Network error'));
    vi.mocked(SugestaoService.aprovar).mockRejectedValue(new TypeError('Network error'));

    await abrirDialog();
    await userEvent.click(await screen.findByRole('button', { name: /aprovar/i }));

    expect(await screen.findByText(/não foi possível confirmar/i)).toBeInTheDocument();
  });

  it('CA3b: 422 (decisão já tomada por outra sessão) mostra o status real como informação e notifica o pai', async () => {
    vi.mocked(SugestaoService.detalhe)
      .mockResolvedValueOnce(makeDetail())
      .mockResolvedValueOnce(makeDetail({ status: 'REJECTED' }));
    vi.mocked(SugestaoService.aprovar).mockRejectedValue(apiError(422));
    const onDecisao = vi.fn();

    render(<RecentSuggestionsPanel sugestoes={SUGESTOES} onDecisao={onDecisao} />);
    await userEvent.click(await screen.findByRole('button', { name: /^ver$/i }));
    await userEvent.click(await screen.findByRole('button', { name: /aprovar/i }));

    expect(await screen.findByText(/não está mais pendente/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert', { name: /erro/i })).not.toBeInTheDocument();
    // Achado do frontend-reviewer (bug real): o pai precisa recarregar a lista mesmo no 422,
    // já que a sugestão deixou de estar PENDING.
    expect(onDecisao).toHaveBeenCalled();
  });

  it('CA4: sugestão já APPROVED não mostra botões de ação', async () => {
    vi.mocked(SugestaoService.detalhe).mockResolvedValue(makeDetail({ status: 'APPROVED' }));

    await abrirDialog();
    await screen.findByText('Aprovada');

    expect(screen.queryByRole('button', { name: /^aprovar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^rejeitar$/i })).not.toBeInTheDocument();
  });

  it('CA5: desabilita os botões durante a chamada (evita duplo clique)', async () => {
    vi.mocked(SugestaoService.detalhe).mockResolvedValue(makeDetail());
    let resolveAprovar: (value: SugestaoCoachOutputDto) => void = () => {};
    vi.mocked(SugestaoService.aprovar).mockReturnValue(
      new Promise((resolve) => {
        resolveAprovar = resolve;
      }) as never,
    );

    await abrirDialog();
    const aprovarBtn = await screen.findByRole('button', { name: /aprovar/i });
    await userEvent.click(aprovarBtn);

    expect(aprovarBtn).toBeDisabled();
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeDisabled();

    resolveAprovar(makeDetail({ status: 'APPROVED' }));
    await waitFor(() => expect(SugestaoService.aprovar).toHaveBeenCalledTimes(1));
  });
});
