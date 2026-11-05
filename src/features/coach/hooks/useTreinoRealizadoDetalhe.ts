import { useCallback, useEffect, useState } from 'react';
import { TreinoService } from '../../../api/services/TreinoService';
import type { TreinoRealizadoDetalhe } from '../../../types/TreinoRealizado';

/** Detalhe do treino realizado para a tela de execução; busca ao montar e em `refetch`. */
export function useTreinoRealizadoDetalhe(treinoRealizadoId: string | undefined) {
    const [data, setData] = useState<TreinoRealizadoDetalhe | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [tentativa, setTentativa] = useState(0);

    useEffect(() => {
        if (!treinoRealizadoId) return;
        let ativo = true;
        setLoading(true);
        setError(null);
        const promise = TreinoService.obterRealizado(treinoRealizadoId);
        promise
            .then((detalhe) => { if (ativo) setData(detalhe); })
            .catch((err: unknown) => {
                if (ativo) setError(err instanceof Error ? err : new Error('Erro ao carregar o treino realizado'));
            })
            .finally(() => { if (ativo) setLoading(false); });
        return () => {
            ativo = false;
            promise.cancel?.();
        };
    }, [treinoRealizadoId, tentativa]);

    const refetch = useCallback(() => setTentativa((n) => n + 1), []);

    return { data, loading, error, refetch };
}
