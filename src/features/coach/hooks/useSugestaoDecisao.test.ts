import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolverMensagemDecisao, useSugestaoDecisao } from './useSugestaoDecisao';
import { SugestaoService } from '../../../api/services/SugestaoService';
import type { SugestaoCoachOutputDto } from '../../../types/SugestaoCoach';

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

describe('resolverMensagemDecisao', () => {
  it('sugestão já não-PENDING: mensagem informativa e notifica o pai', () => {
    const { mensagem, deveNotificarPai } = resolverMensagemDecisao(makeDetail({ status: 'APPROVED' }));
    expect(mensagem.severity).toBe('info');
    expect(mensagem.text).toMatch(/aprovada/i);
    expect(deveNotificarPai).toBe(true);
  });

  it('sugestão continua PENDING: mensagem de erro e não notifica o pai', () => {
    const { mensagem, deveNotificarPai } = resolverMensagemDecisao(makeDetail({ status: 'PENDING' }));
    expect(mensagem.severity).toBe('error');
    expect(deveNotificarPai).toBe(false);
  });
});

describe('useSugestaoDecisao', () => {
  beforeEach(() => vi.clearAllMocks());

  it('decisão com sucesso: aplica o resultado e chama onDecisao', async () => {
    vi.mocked(SugestaoService.aprovar).mockResolvedValue(makeDetail({ status: 'APPROVED' }));
    const onDecisao = vi.fn();
    const onResultado = vi.fn();
    const { result } = renderHook(() => useSugestaoDecisao(onDecisao));

    await act(async () => {
      await result.current.decidir('s1', 'aprovar', onResultado);
    });

    expect(onResultado).toHaveBeenCalledWith(expect.objectContaining({ status: 'APPROVED' }));
    expect(onDecisao).toHaveBeenCalled();
    expect(result.current.decisionMessage).toBeNull();
  });

  it('falha na mutação, mas reconsulta mostra sugestão já decidida (422 de outra sessão): notifica o pai (bug real corrigido)', async () => {
    vi.mocked(SugestaoService.aprovar).mockRejectedValue(new Error('422'));
    vi.mocked(SugestaoService.detalhe).mockResolvedValue(makeDetail({ status: 'REJECTED' }));
    const onDecisao = vi.fn();
    const onResultado = vi.fn();
    const { result } = renderHook(() => useSugestaoDecisao(onDecisao));

    await act(async () => {
      await result.current.decidir('s1', 'aprovar', onResultado);
    });

    expect(onResultado).toHaveBeenCalledWith(expect.objectContaining({ status: 'REJECTED' }));
    expect(onDecisao).toHaveBeenCalled();
    expect(result.current.decisionMessage?.severity).toBe('info');
  });

  it('falha na mutação e reconsulta confirma PENDING: erro genérico, sem notificar o pai', async () => {
    vi.mocked(SugestaoService.aprovar).mockRejectedValue(new Error('network'));
    vi.mocked(SugestaoService.detalhe).mockResolvedValue(makeDetail({ status: 'PENDING' }));
    const onDecisao = vi.fn();
    const { result } = renderHook(() => useSugestaoDecisao(onDecisao));

    await act(async () => {
      await result.current.decidir('s1', 'aprovar', vi.fn());
    });

    expect(onDecisao).not.toHaveBeenCalled();
    expect(result.current.decisionMessage?.severity).toBe('error');
  });

  it('falha na mutação e a reconsulta também falha: mensagem de recarregar', async () => {
    vi.mocked(SugestaoService.aprovar).mockRejectedValue(new Error('network'));
    vi.mocked(SugestaoService.detalhe).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useSugestaoDecisao());

    await act(async () => {
      await result.current.decidir('s1', 'aprovar', vi.fn());
    });

    expect(result.current.decisionMessage?.text).toMatch(/recarregue/i);
  });

  it('deciding fica true durante a chamada e volta a false ao terminar', async () => {
    let resolveAprovar: (v: SugestaoCoachOutputDto) => void = () => {};
    vi.mocked(SugestaoService.aprovar).mockReturnValue(
      new Promise((resolve) => {
        resolveAprovar = resolve;
      }) as never,
    );
    const { result } = renderHook(() => useSugestaoDecisao());

    let decisionPromise: Promise<void>;
    act(() => {
      decisionPromise = result.current.decidir('s1', 'aprovar', vi.fn());
    });

    await waitFor(() => expect(result.current.deciding).toBe(true));

    resolveAprovar(makeDetail({ status: 'APPROVED' }));
    await act(async () => {
      await decisionPromise;
    });

    expect(result.current.deciding).toBe(false);
  });
});
