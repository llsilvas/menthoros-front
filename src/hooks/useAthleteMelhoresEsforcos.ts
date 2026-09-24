import { useCallback, useState } from 'react';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteMelhorEsforco, MelhoresEsforcosJanela } from '../types/AthleteProgress';

/**
 * Melhores esforços do atleta autenticado (`GET /api/v1/atletas/me/melhores-esforcos`).
 * `integracaoConectada=false` não popula `error` — é estado válido, tratado pelo CTA de conexão.
 */
export const useAthleteMelhoresEsforcos = () => {
    const [marcas, setMarcas] = useState<AthleteMelhorEsforco[]>([]);
    const [integracaoConectada, setIntegracaoConectada] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMelhoresEsforcos = useCallback(async (janela: MelhoresEsforcosJanela = '42d') => {
        try {
            setLoading(true);
            setError(null);
            const resultado = await AthleteProgressService.getMelhoresEsforcos(janela);
            setMarcas(resultado.marcas);
            setIntegracaoConectada(resultado.integracaoConectada);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar melhores esforços do atleta'));
            setMarcas([]);
        } finally {
            setLoading(false);
        }
    }, []);

    return { marcas, integracaoConectada, loading, error, fetchMelhoresEsforcos };
};
