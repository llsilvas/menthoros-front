import { useEffect, useState } from 'react';
import { TreinoService } from '../../../api/services/TreinoService';

export function useDecouplingRealizado(treinoRealizadoId: string | undefined, enabled: boolean) {
    const [decoupling, setDecoupling] = useState<number | null>(null);

    useEffect(() => {
        if (!enabled || !treinoRealizadoId) {
            setDecoupling(null);
            return;
        }
        // Best-effort: falha não quebra a tela do coach.
        const promise = TreinoService.obterRealizado(treinoRealizadoId);
        promise
            .then((data) => setDecoupling(data.decouplingPercentual ?? null))
            .catch(() => console.error('Falha ao carregar decoupling do treino'));
        return () => promise.cancel();
    }, [treinoRealizadoId, enabled]);

    return { decoupling };
}
