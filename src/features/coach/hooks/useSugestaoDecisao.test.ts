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
    editadoPeloCoach: false,
    versao: 0,
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

  it('rejeitar sem motivo: chama SugestaoService.rejeitar(id, undefined)', async () => {
    vi.mocked(SugestaoService.rejeitar).mockResolvedValue(makeDetail({ status: 'REJECTED' }));
    const { result } = renderHook(() => useSugestaoDecisao());

    await act(async () => {
      await result.current.decidir('s1', 'rejeitar', vi.fn());
    });

    expect(SugestaoService.rejeitar).toHaveBeenCalledWith('s1', undefined, undefined);
  });

  it('rejeitar com motivo: repassa o motivo para SugestaoService.rejeitar', async () => {
    vi.mocked(SugestaoService.rejeitar).mockResolvedValue(makeDetail({ status: 'REJECTED' }));
    const { result } = renderHook(() => useSugestaoDecisao());

    await act(async () => {
      await result.current.decidir('s1', 'rejeitar', vi.fn(), 'volume alto demais');
    });

    expect(SugestaoService.rejeitar).toHaveBeenCalledWith('s1', 'volume alto demais', undefined);
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

    let decisionPromise: Promise<unknown>;
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

  describe('editar', () => {
    it('sucesso: devolve ok, entrega o resultado e não notifica o pai', async () => {
      vi.mocked(SugestaoService.editar).mockResolvedValue(makeDetail({ summary: 'novo', versao: 1 }));
      const onDecisao = vi.fn();
      const onResultado = vi.fn();
      const { result } = renderHook(() => useSugestaoDecisao(onDecisao));

      let r: unknown;
      await act(async () => {
        r = await result.current.editar('s1', 'novo', 0, onResultado);
      });

      expect(r).toBe('ok');
      expect(SugestaoService.editar).toHaveBeenCalledWith('s1', 'novo', 0);
      expect(onResultado).toHaveBeenCalledWith(expect.objectContaining({ versao: 1 }));
      expect(onDecisao).not.toHaveBeenCalled();
    });

    it('409: versão do servidor diferente da lida → conflito e aviso de que mudou', async () => {
      vi.mocked(SugestaoService.editar).mockRejectedValue(new Error('409'));
      vi.mocked(SugestaoService.detalhe).mockResolvedValue(makeDetail({ versao: 2 }));
      const { result } = renderHook(() => useSugestaoDecisao());

      let r: unknown;
      await act(async () => {
        r = await result.current.editar('s1', 'novo', 0, vi.fn());
      });

      expect(r).toBe('conflito');
      expect(result.current.decisionMessage?.text).toMatch(/mudou desde que você abriu/i);
    });

    it('falha com a mesma versão: devolve falha e a mensagem fala em salvar, não em decidir', async () => {
      vi.mocked(SugestaoService.editar).mockRejectedValue(new Error('500'));
      vi.mocked(SugestaoService.detalhe).mockResolvedValue(makeDetail({ versao: 0 }));
      const { result } = renderHook(() => useSugestaoDecisao());

      let r: unknown;
      await act(async () => {
        r = await result.current.editar('s1', 'novo', 0, vi.fn());
      });

      expect(r).toBe('falha');
      expect(result.current.decisionMessage?.text).toMatch(/salvar a edição/i);
    });
  });
});
