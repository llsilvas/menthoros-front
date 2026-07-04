import { useCallback, useState } from 'react';
import { CheckinService } from '../api/services/CheckinService';
import { UsuarioService } from '../api/services/UsuarioService';
import type { CheckinProntidaoOutput } from '../types/Checkin';

function hojeIso(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Check-in de hoje do atleta autenticado, se existir. `GET /api/v1/checkins/{atletaId}/atual`
 * não é self-resolving (recebe `atletaId` no path) — resolve via `UsuarioService.getMe()` (mesmo
 * padrão de `useAthletePlan.ts`) — e retorna o mais recente, não necessariamente o de hoje, então
 * filtramos `data === hoje` aqui para nunca fabricar um falso positivo de "já fez check-in hoje".
 */
export const useCheckinAtual = () => {
    const [checkinHoje, setCheckinHoje] = useState<CheckinProntidaoOutput | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCheckinAtual = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const me = await UsuarioService.getMe();
            if (!me.atletaId) {
                setCheckinHoje(null);
                return;
            }

            const atual = await CheckinService.buscarAtual(me.atletaId);
            setCheckinHoje(atual && atual.data === hojeIso() ? atual : null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar check-in atual'));
            setCheckinHoje(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { checkinHoje, loading, error, fetchCheckinAtual };
};
