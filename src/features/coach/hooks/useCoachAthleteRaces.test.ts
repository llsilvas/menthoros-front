import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCoachAthleteRaces } from './useCoachAthleteRaces';
import { ProvaService } from '../../../api/services/ProvaService';
import type { Prova } from '../../../types/Prova';

vi.mock('../../../api/services/ProvaService');

const PROVA: Prova = { id: 'p1', nomeProva: 'Maratona SP', dataProva: '2026-12-06', tipoProva: 'MARATONA', distancia: 'KM_42', revisadaPeloCoach: false, motivoRevisao: 'NOVA' };

describe('useCoachAthleteRaces', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(ProvaService.listarProvas).mockResolvedValue([PROVA]);
        vi.mocked(ProvaService.listarPendentesRevisao).mockResolvedValue([PROVA]);
    });

    it('carrega lista e pendentes ao montar', async () => {
        const { result } = renderHook(() => useCoachAthleteRaces('atleta-1'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.provas).toEqual([PROVA]);
        expect(result.current.pendentes).toEqual([PROVA]);
        expect(ProvaService.listarPendentesRevisao).toHaveBeenCalledWith('atleta-1');
    });

    it('sem atletaId não chama o backend', () => {
        renderHook(() => useCoachAthleteRaces(undefined));
        expect(ProvaService.listarProvas).not.toHaveBeenCalled();
    });

    it('marcarCiente chama o PATCH e recarrega', async () => {
        vi.mocked(ProvaService.marcarCiente).mockResolvedValue({ ...PROVA, revisadaPeloCoach: true });
        const { result } = renderHook(() => useCoachAthleteRaces('atleta-1'));
        await waitFor(() => expect(result.current.loading).toBe(false));
        vi.mocked(ProvaService.listarPendentesRevisao).mockResolvedValue([]);

        await act(async () => { await result.current.marcarCiente('p1'); });

        expect(ProvaService.marcarCiente).toHaveBeenCalledWith('atleta-1', 'p1');
        expect(result.current.pendentes).toEqual([]);
        expect(result.current.acting).toBe(false);
    });

    it('falha na carga expõe error', async () => {
        vi.mocked(ProvaService.listarProvas).mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => useCoachAthleteRaces('atleta-1'));

        await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    });
});
