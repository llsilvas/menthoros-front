import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteRaces } from './useAthleteRaces';
import { ProvaService } from '../api/services/ProvaService';
import { UsuarioService } from '../api/services/UsuarioService';
import type { Prova } from '../types/Prova';

vi.mock('../api/services/ProvaService');
vi.mock('../api/services/UsuarioService');

const USUARIO = { id: 'usuario-1', nome: 'Atleta', email: 'a@t.com', role: 'ATLETA' as const, lgpdConsentGranted: true, onboardingConcluido: true, lgpdCurrentPolicyVersion: '2026-06-30', lgpdCurrentTermsVersion: '2026-06-30' };
const PROVA: Prova = { id: 'p1', nomeProva: 'Maratona SP', dataProva: '2027-04-11', tipoProva: 'MARATONA', distancia: 'KM_42' };

describe('useAthleteRaces', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(UsuarioService.getMe).mockResolvedValue({ ...USUARIO, atletaId: 'atleta-1' });
    });

    it('resolve o atletaId uma vez e lista as provas pelo endpoint de CRUD', async () => {
        vi.mocked(ProvaService.listarProvas).mockResolvedValue([PROVA]);

        const { result } = renderHook(() => useAthleteRaces());
        await act(async () => { await result.current.fetchRaces(); });
        await act(async () => { await result.current.fetchRaces(); });

        expect(result.current.races).toEqual([PROVA]);
        expect(result.current.loading).toBe(false);
        expect(ProvaService.listarProvas).toHaveBeenCalledWith('atleta-1');
        expect(UsuarioService.getMe).toHaveBeenCalledTimes(1);
    });

    it('sem atleta vinculado vira erro, não lista vazia silenciosa', async () => {
        vi.mocked(UsuarioService.getMe).mockResolvedValue({ ...USUARIO });

        const { result } = renderHook(() => useAthleteRaces());
        await act(async () => { await result.current.fetchRaces(); });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(ProvaService.listarProvas).not.toHaveBeenCalled();
    });

    it('createRace envia só o subconjunto do atleta para o atleta resolvido', async () => {
        vi.mocked(ProvaService.criarProva).mockResolvedValue(PROVA);
        const input = { nomeProva: 'Maratona SP', dataProva: '2027-04-11', tipoProva: 'MARATONA' as const, distancia: 'KM_42' as const, provaAlvo: true };

        const { result } = renderHook(() => useAthleteRaces());
        let criada: Prova | undefined;
        await act(async () => { criada = await result.current.createRace(input); });

        expect(criada).toEqual(PROVA);
        expect(ProvaService.criarProva).toHaveBeenCalledWith('atleta-1', input);
        expect(result.current.saving).toBe(false);
    });

    it('cancelRace chama DELETE e remove da lista local', async () => {
        vi.mocked(ProvaService.listarProvas).mockResolvedValue([PROVA]);
        vi.mocked(ProvaService.deletarProva).mockResolvedValue(undefined);

        const { result } = renderHook(() => useAthleteRaces());
        await act(async () => { await result.current.fetchRaces(); });
        await act(async () => { await result.current.cancelRace('p1'); });

        expect(ProvaService.deletarProva).toHaveBeenCalledWith('atleta-1', 'p1');
        expect(result.current.races).toEqual([]);
    });

    it('falha ao salvar expõe error e propaga', async () => {
        vi.mocked(ProvaService.criarProva).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteRaces());
        let erro: unknown;
        await act(async () => {
            try {
                await result.current.createRace({ nomeProva: 'X', dataProva: '2027-04-11', tipoProva: 'MARATONA', distancia: 'KM_42', provaAlvo: false });
            } catch (e) {
                erro = e;
            }
        });

        expect(erro).toBeInstanceOf(Error);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.saving).toBe(false);
    });
});
