import { useEffect, useState } from 'react';
import { OnboardingService } from '../../../api/services/OnboardingService';
import { resolverAtletaIdAtual } from '../../../hooks/resolverAtletaId';
import type { DispositivoMarca } from '../../../types/Onboarding';

/**
 * Marca e modelo do relógio informados no onboarding. Hook próprio em vez de `useOnboarding`: aquele
 * não busca no mount, expõe a API de edição do formulário e retém o perfil anterior quando a
 * resposta vem vazia. Sem perfil o endpoint devolve 204 (→ `undefined`), que aqui é "sem marca",
 * não erro.
 */
export function useAthleteWatchBrand(atletaIdParam?: string) {
    const [marca, setMarca] = useState<DispositivoMarca | undefined>();
    const [modelo, setModelo] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelado = false;
        setMarca(undefined);
        setModelo(undefined);
        setError(null);
        setLoading(true);

        (async () => {
            try {
                const atletaId = atletaIdParam ?? (await resolverAtletaIdAtual());
                const perfil = atletaId ? await OnboardingService.buscarRascunho(atletaId) : undefined;
                if (cancelado) return;
                setMarca(perfil?.dispositivoMarca ?? undefined);
                setModelo(perfil?.dispositivoModelo ?? undefined);
            } catch (err) {
                if (!cancelado) setError(err instanceof Error ? err : new Error('Erro ao carregar o relógio do atleta'));
            } finally {
                if (!cancelado) setLoading(false);
            }
        })();

        return () => {
            cancelado = true;
        };
    }, [atletaIdParam]);

    return { marca, modelo, loading, error };
}
