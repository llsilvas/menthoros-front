import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlanoSemanal } from './usePlanoSemanal';
import { PlanoSemanasService } from '../services/PlanoSemanasService';
import type { PlanoSemanal } from '../types/PlanoSemanal';

vi.mock('../services/PlanoSemanasService', () => ({
    PlanoSemanasService: { listarSemanasDoAtleta: vi.fn() },
}));
vi.mock('../api/services/PlanoSemanalService', () => ({
    PlanoSemanalService: { deletarPlanoSemanal: vi.fn() },
}));

const listar = vi.mocked(PlanoSemanasService.listarSemanasDoAtleta);

const plano = (id: string, atletaId: string) => ({ id, atletaId }) as PlanoSemanal;

function adiado<T>() {
    let resolve: (v: T) => void = () => {};
    let reject: (e: unknown) => void = () => {};
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

describe('usePlanoSemanal.fetchPlanosPorAtleta', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('sucesso devolve "ok" e grava os planos', async () => {
        listar.mockResolvedValue([plano('p1', 'a1')]);
        const { result } = renderHook(() => usePlanoSemanal());

        let r: string | undefined;
        await act(async () => { r = await result.current.fetchPlanosPorAtleta('a1'); });

        expect(r).toBe('ok');
        expect(result.current.planos).toEqual([plano('p1', 'a1')]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('falha devolve "falha" e mantém o setError para os outros consumidores', async () => {
        listar.mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => usePlanoSemanal());

        let r: string | undefined;
        await act(async () => { r = await result.current.fetchPlanosPorAtleta('a1'); });

        expect(r).toBe('falha');
        expect(result.current.error?.message).toBe('boom');
        expect(result.current.loading).toBe(false);
    });

    it('resposta atrasada de outro atleta é descartada e devolve "obsoleta"', async () => {
        const lenta = adiado<PlanoSemanal[]>();
        const rapida = adiado<PlanoSemanal[]>();
        listar.mockReturnValueOnce(lenta.promise as never).mockReturnValueOnce(rapida.promise as never);
        const { result } = renderHook(() => usePlanoSemanal());

        let primeira: Promise<string> | undefined;
        let segunda: Promise<string> | undefined;
        act(() => {
            primeira = result.current.fetchPlanosPorAtleta('a1');
            segunda = result.current.fetchPlanosPorAtleta('a2');
        });

        await act(async () => { rapida.resolve([plano('p2', 'a2')]); await segunda; });
        expect(result.current.loading).toBe(false);

        let r1: string | undefined;
        await act(async () => { lenta.resolve([plano('p1', 'a1')]); r1 = await primeira; });

        expect(r1).toBe('obsoleta');
        expect(await segunda).toBe('ok');
        expect(result.current.planos).toEqual([plano('p2', 'a2')]);
        expect(result.current.loading).toBe(false);
    });

    it('falha atrasada não grava erro sobre a lista mais nova', async () => {
        const lenta = adiado<PlanoSemanal[]>();
        listar.mockReturnValueOnce(lenta.promise as never).mockResolvedValueOnce([plano('p2', 'a2')]);
        const { result } = renderHook(() => usePlanoSemanal());

        let primeira: Promise<string> | undefined;
        await act(async () => {
            primeira = result.current.fetchPlanosPorAtleta('a1');
            await result.current.fetchPlanosPorAtleta('a2');
        });

        let r1: string | undefined;
        await act(async () => { lenta.reject(new Error('timeout')); r1 = await primeira; });

        expect(r1).toBe('obsoleta');
        expect(result.current.error).toBeNull();
        expect(result.current.planos).toEqual([plano('p2', 'a2')]);
    });
});
