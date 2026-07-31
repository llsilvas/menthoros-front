import { act, renderHook } from '@testing-library/react';
import { format } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCheckinAtual } from './useCheckinAtual';
import { CheckinService } from '../api/services/CheckinService';
import { UsuarioService } from '../api/services/UsuarioService';
import type { CheckinProntidaoOutput } from '../types/Checkin';

vi.mock('../api/services/CheckinService');
vi.mock('../api/services/UsuarioService');

const HOJE_ISO = format(new Date(), 'yyyy-MM-dd');

function checkin(data: string): CheckinProntidaoOutput {
    return {
        id: 'abc', atletaId: 'atleta-1', data,
        qualidadeSono: 8, humor: 7, doresMusculares: 2, nivelEnergia: 6, estresse: 3,
        readinessScore: 0.82, nivelProntidao: 'PRONTO',
    };
}

const USUARIO_BASE = { id: 'usuario-1', nome: 'Atleta Teste', email: 'atleta@teste.com', role: 'ATLETA' as const, lgpdConsentGranted: true, };

describe('useCheckinAtual', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(UsuarioService.getMe).mockResolvedValue({ ...USUARIO_BASE, atletaId: 'atleta-1' });
    });

    it('retorna o check-in quando ele é de hoje', async () => {
        vi.mocked(CheckinService.buscarAtual).mockResolvedValue(checkin(HOJE_ISO));

        const { result } = renderHook(() => useCheckinAtual());
        await act(async () => {
            await result.current.fetchCheckinAtual();
        });

        expect(result.current.checkinHoje?.data).toBe(HOJE_ISO);
        expect(result.current.error).toBeNull();
    });

    it('trata check-in de outro dia como "sem check-in hoje" (não fabrica falso positivo)', async () => {
        vi.mocked(CheckinService.buscarAtual).mockResolvedValue(checkin('2020-01-01'));

        const { result } = renderHook(() => useCheckinAtual());
        await act(async () => {
            await result.current.fetchCheckinAtual();
        });

        expect(result.current.checkinHoje).toBeNull();
    });

    it('trata ausência de check-in (204) como "sem check-in hoje"', async () => {
        vi.mocked(CheckinService.buscarAtual).mockResolvedValue(undefined);

        const { result } = renderHook(() => useCheckinAtual());
        await act(async () => {
            await result.current.fetchCheckinAtual();
        });

        expect(result.current.checkinHoje).toBeNull();
    });

    it('trata usuário sem atletaId vinculado como "sem check-in", sem erro', async () => {
        vi.mocked(UsuarioService.getMe).mockResolvedValue(USUARIO_BASE);

        const { result } = renderHook(() => useCheckinAtual());
        await act(async () => {
            await result.current.fetchCheckinAtual();
        });

        expect(result.current.checkinHoje).toBeNull();
        expect(result.current.error).toBeNull();
        expect(CheckinService.buscarAtual).not.toHaveBeenCalled();
    });

    it('popula error na falha', async () => {
        vi.mocked(CheckinService.buscarAtual).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useCheckinAtual());
        await act(async () => {
            await result.current.fetchCheckinAtual();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.checkinHoje).toBeNull();
    });
});
