import { useCallback, useState } from 'react';
import { RaceProjectionService } from '../api/services/RaceProjectionService';
import type {
    GenerateRaceProjectionRequest,
    RaceProjectionSnapshot,
    AthleteProjectionView,
} from '../types/RaceProjection';

export const useRaceProjection = () => {
    const [snapshot, setSnapshot] = useState<RaceProjectionSnapshot | null>(null);
    const [historico, setHistorico] = useState<RaceProjectionSnapshot[]>([]);
    const [oficial, setOficial] = useState<RaceProjectionSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (
        atletaId: string,
        request: GenerateRaceProjectionRequest,
    ): Promise<RaceProjectionSnapshot | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await RaceProjectionService.gerarProjecao(atletaId, request);
            setSnapshot(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao gerar projeção');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistorico = useCallback(async (
        atletaId: string,
        provaId: string,
    ): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const data = await RaceProjectionService.listarHistorico(atletaId, provaId);
            setHistorico(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
            setHistorico([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOficial = useCallback(async (
        atletaId: string,
        provaId: string,
    ): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const data = await RaceProjectionService.buscarOficial(atletaId, provaId);
            setOficial(data);
        } catch (err) {
            setOficial(null);
            if (err instanceof Error && !err.message.includes('404')) {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const marcarOficial = useCallback(async (
        atletaId: string,
        snapshotId: string,
        provaId: string,
    ): Promise<RaceProjectionSnapshot | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await RaceProjectionService.marcarComoOficial(atletaId, snapshotId, provaId);
            setOficial(result);
            setHistorico(prev =>
                prev.map(s =>
                    s.id === snapshotId
                        ? result
                        : { ...s, isOfficial: false, coachReviewedAt: undefined }
                )
            );
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao marcar como oficial');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchVisaoAtleta = useCallback(async (
        atletaId: string,
        provaId: string,
    ): Promise<AthleteProjectionView | null> => {
        setLoading(true);
        setError(null);
        try {
            return await RaceProjectionService.buscarVisaoAtleta(atletaId, provaId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar visão do atleta');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSnapshot = useCallback(() => setSnapshot(null), []);
    const clearError = useCallback(() => setError(null), []);

    return {
        snapshot,
        historico,
        oficial,
        loading,
        error,
        generate,
        fetchHistorico,
        fetchOficial,
        marcarOficial,
        fetchVisaoAtleta,
        clearSnapshot,
        clearError,
    };
};
