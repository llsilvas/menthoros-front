import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFoundersSlots } from './useFoundersSlots';
import { FoundersSlotsService } from '../services/FoundersSlotsService';

vi.mock('../services/FoundersSlotsService', () => ({
  FoundersSlotsService: { obterVagas: vi.fn() },
}));

const obterVagasMock = FoundersSlotsService.obterVagas as unknown as ReturnType<typeof vi.fn>;

describe('useFoundersSlots', () => {
  beforeEach(() => {
    obterVagasMock.mockReset();
  });

  it('começa carregando e resolve com o dado em sucesso', async () => {
    obterVagasMock.mockResolvedValue({ total: 10, taken: 3, remaining: 7, open: true });
    const { result } = renderHook(() => useFoundersSlots());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ total: 10, taken: 3, remaining: 7, open: true });
    expect(result.current.error).toBe(false);
  });

  it('falha vira error:true, sem derrubar o hook', async () => {
    obterVagasMock.mockRejectedValue(new Error('falha de rede'));
    const { result } = renderHook(() => useFoundersSlots());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('desmontar antes da resposta não aplica o resultado tardio', async () => {
    // React 18+ não emite mais o warning "setState on unmounted component" para componentes de
    // função — então nem este spy nem `result.current` pós-unmount conseguem provar de forma
    // decisiva que o guard `cancelado` existe (achado do frontend-reviewer: o `toBeDefined()`
    // anterior era trivialmente verdadeiro mesmo sem o guard). O valor real deste teste é de
    // regressão: qualquer erro ou log inesperado no fluxo resolve-após-unmount falha aqui.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let resolver: (value: { total: number; taken: number; remaining: number; open: boolean }) => void;
    obterVagasMock.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      }),
    );
    const { unmount } = renderHook(() => useFoundersSlots());
    unmount();

    resolver!({ total: 10, taken: 3, remaining: 7, open: true });
    await new Promise((r) => setTimeout(r, 0));

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
