import { useCallback, useState } from 'react';
import { ProvaService } from '../api/services/ProvaService';
import { UsuarioService } from '../api/services/UsuarioService';
import type { CreateProvaAtleta, Prova } from '../types/Prova';

/**
 * CRUD das provas do atleta autenticado sobre `/api/v1/atletas/{atletaId}/provas`. O endpoint
 * recebe o id no path, então o `atletaId` é resolvido uma vez via `GET /users/me` (mesmo caminho
 * de `useAthletePlan`). A leitura para home/plano continua em `useAthleteProvas` (`/me/provas`).
 */
export const useAthleteRaces = () => {
    const [atletaId, setAtletaId] = useState<string | null>(null);
    const [races, setRaces] = useState<Prova[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const resolveAtletaId = useCallback(async (): Promise<string> => {
        if (atletaId) return atletaId;
        const me = await UsuarioService.getMe();
        if (!me.atletaId) {
            throw new Error('Usuário autenticado não tem atleta vinculado');
        }
        setAtletaId(me.atletaId);
        return me.atletaId;
    }, [atletaId]);

    const fetchRaces = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const id = await resolveAtletaId();
            setRaces(await ProvaService.listarProvas(id));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar suas provas'));
        } finally {
            setLoading(false);
        }
    }, [resolveAtletaId]);

    const getRace = useCallback(async (provaId: string): Promise<Prova> => {
        const id = await resolveAtletaId();
        return ProvaService.buscarProvaPorId(id, provaId);
    }, [resolveAtletaId]);

    const createRace = useCallback(async (input: CreateProvaAtleta): Promise<Prova> => {
        setSaving(true);
        setError(null);
        try {
            const id = await resolveAtletaId();
            return await ProvaService.criarProva(id, input);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao cadastrar prova'));
            throw err;
        } finally {
            setSaving(false);
        }
    }, [resolveAtletaId]);

    const updateRace = useCallback(async (provaId: string, input: CreateProvaAtleta): Promise<Prova> => {
        setSaving(true);
        setError(null);
        try {
            const id = await resolveAtletaId();
            return await ProvaService.atualizarProva(id, provaId, { id: provaId, ...input });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao atualizar prova'));
            throw err;
        } finally {
            setSaving(false);
        }
    }, [resolveAtletaId]);

    /** DELETE pelo atleta é cancelamento (soft) no backend — a prova some da lista, mas é preservada. */
    const cancelRace = useCallback(async (provaId: string): Promise<void> => {
        setSaving(true);
        setError(null);
        try {
            const id = await resolveAtletaId();
            await ProvaService.deletarProva(id, provaId);
            setRaces((prev) => prev.filter((p) => p.id !== provaId));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao cancelar prova'));
            throw err;
        } finally {
            setSaving(false);
        }
    }, [resolveAtletaId]);

    return { races, loading, saving, error, fetchRaces, getRace, createRace, updateRace, cancelRace };
};
