import { useCallback, useState } from 'react';
import { ApiError } from '../api/core/ApiError';
import { PlanoSemanalService } from '../api/services/PlanoSemanalService';
import { UsuarioService } from '../api/services/UsuarioService';
import { selectAthletePlan } from '../features/athlete/adapters/selectAthletePlan';
import type { PlanoSemanal } from '../types/PlanoSemanal';

/**
 * Plano semanal APROVADO do atleta autenticado. Resolve o `atletaId` via `GET /users/me`
 * (o endpoint de plano recebe o id no path, não é uma rota `/me`), busca em
 * `GET /api/v1/planos/{atletaId}` (o backend filtra APROVADO para a role ATLETA) e seleciona
 * o plano da semana corrente. Sem plano aprovado (404 ou lista vazia) → `plano = null`
 * (estado vazio, não erro).
 */
export const useAthletePlan = () => {
    const [plano, setPlano] = useState<PlanoSemanal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchPlano = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const me = await UsuarioService.getMe();
            if (!me.atletaId) {
                setPlano(null);
                return;
            }
            const resposta = await PlanoSemanalService.listarPlanosPorAtleta(me.atletaId);
            setPlano(selectAthletePlan(resposta));
        } catch (err) {
            // Sem plano aprovado ainda é um estado vazio legítimo, não um erro de tela.
            if (err instanceof ApiError && err.status === 404) {
                setPlano(null);
            } else {
                setError(err instanceof Error ? err : new Error('Erro ao buscar plano semanal'));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    return { plano, loading, error, fetchPlano };
};
