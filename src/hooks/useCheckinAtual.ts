import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { CheckinService } from '../api/services/CheckinService';
import { UsuarioService } from '../api/services/UsuarioService';
import type { CheckinProntidaoOutput } from '../types/Checkin';

// Data LOCAL do atleta, não UTC — `toISOString()` viraria o dia à noite (ex.: 21h-23h59 no
// horário do Brasil, UTC-3), fabricando um falso negativo de "não fez check-in hoje".
function hojeIso(): string {
    return format(new Date(), 'yyyy-MM-dd');
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
