import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/core/ApiError';
import { CoachAthleteZonesService } from '../api/services/CoachAthleteZonesService';
import type { AthleteTrainingZonesDto } from '../types/AthleteTrainingZones';

const ouvintes = new Map<string, Set<() => void>>();

/** Recarrega toda instância montada do hook para o atleta (ex.: após salvar as âncoras). */
export const invalidarZonasDoAtleta = (atletaId: string) => {
    ouvintes.get(atletaId)?.forEach((recarregar) => recarregar());
};

/**
 * Zonas de pace e FC do atleta, para o treinador (`GET /api/v1/coach/atletas/{atletaId}/zonas`).
 * Busca ao montar e a cada troca de `atletaId`. 404 (atleta fora do tenant) vira `zones = null`
 * sem erro: não há o que mostrar, e não é falha de carregamento.
 */
export const useAthleteTrainingZones = (atletaId: string | undefined) => {
    const [zones, setZones] = useState<AthleteTrainingZonesDto | null>(null);
    const [loading, setLoading] = useState(Boolean(atletaId));
    const [error, setError] = useState<Error | null>(null);

    // Só a requisição mais recente vale: resposta atrasada (ou de outro atleta) é descartada.
    const ultimaRequisicao = useRef(0);

    // `silenciosa` recarrega sem voltar a `loading`: o card não pode virar skeleton (e fechar o
    // acordeão do treinador) a cada salvamento de âncoras.
    const carregar = useCallback(async (silenciosa: boolean) => {
        if (!atletaId) return;
        const minha = ++ultimaRequisicao.current;
        try {
            if (!silenciosa) setLoading(true);
            setError(null);
            const resposta = await CoachAthleteZonesService.getZonas(atletaId);
            if (minha === ultimaRequisicao.current) setZones(resposta);
        } catch (err) {
            if (minha !== ultimaRequisicao.current) return;
            setZones(null);
            if (err instanceof ApiError && err.status === 404) return;
            setError(err instanceof Error ? err : new Error('Erro ao buscar zonas do atleta'));
        } finally {
            if (minha === ultimaRequisicao.current) setLoading(false);
        }
    }, [atletaId]);

    const fetchZones = useCallback(() => carregar(false), [carregar]);

    useEffect(() => {
        setZones(null);
        void fetchZones();
    }, [fetchZones]);

    useEffect(() => {
        if (!atletaId) return;
        const recarregar = () => void carregar(true);
        const set = ouvintes.get(atletaId) ?? new Set();
        set.add(recarregar);
        ouvintes.set(atletaId, set);
        return () => {
            set.delete(recarregar);
            if (set.size === 0) ouvintes.delete(atletaId);
        };
    }, [atletaId, carregar]);

    return { zones, loading, error, fetchZones };
};
