import { useCallback, useState } from 'react';
import { OnboardingService } from '../api/services/OnboardingService';
import { resolverAtletaIdAtual } from './resolverAtletaId';
import type { CalibrationStatus } from '../types/Calibracao';

const CALIBRACAO_STORAGE_KEY = 'menthoros:onboarding:emCalibracao';

/**
 * `localStorage` pode lançar em ambientes que o bloqueiam (iframes sandboxed, alguns modos
 * privados) — isolado do try/catch principal de `fetchStatus` (achado QA 2026-07-22, frontend-
 * reviewer) para que uma falha de storage degrade para "sem transição detectada" em vez de
 * mascarar o status de calibração já obtido com sucesso como um erro genérico de rede.
 */
function lerFlagCalibracaoAnterior(): boolean {
    try {
        return localStorage.getItem(CALIBRACAO_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function gravarFlagCalibracao(emCalibracao: boolean): void {
    try {
        if (emCalibracao) {
            localStorage.setItem(CALIBRACAO_STORAGE_KEY, 'true');
        } else {
            localStorage.removeItem(CALIBRACAO_STORAGE_KEY);
        }
    } catch {
        // Sem persistência disponível — a detecção de "acabou de sair" fica indisponível nesta
        // sessão, mas o status de calibração em si (já obtido da API) continua funcionando.
    }
}

/**
 * Status de calibração do atleta autenticado, para o `CalibrationBanner` (task 8.2/8.5). Resolve
 * `atletaId` via `GET /users/me` (mesmo padrão de `useAthletePlan`/`useCheckinAtual`). Detecta a
 * transição "estava em CALIBRATION e agora não está mais" comparando com um flag persistido em
 * `localStorage` — necessário porque a saída da calibração acontece na geração de plano (fora do
 * fluxo do usuário), então o "acabei de sair" só é perceptível comparando visitas diferentes à
 * Home, não dentro de uma única sessão (mesma simplificação de `bannerDispensado` no
 * `AthleteHomePage`: sem persistência entre sessões documentada como aceitável no XS).
 */
export const useCalibracao = () => {
    const [status, setStatus] = useState<CalibrationStatus | null>(null);
    const [justExited, setJustExited] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const idAtual = await resolverAtletaIdAtual();
            if (!idAtual) {
                setStatus(null);
                return;
            }
            const atual = await OnboardingService.obterStatusCalibracao(idAtual);
            const estavaEmCalibracao = lerFlagCalibracaoAnterior();

            if (atual) {
                gravarFlagCalibracao(true);
                setJustExited(false);
            } else if (estavaEmCalibracao) {
                gravarFlagCalibracao(false);
                setJustExited(true);
            }
            setStatus(atual ?? null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar status de calibração', { cause: err }));
        } finally {
            setLoading(false);
        }
    }, []);

    const dismissJustExited = useCallback(() => setJustExited(false), []);

    return { status, justExited, loading, error, fetchStatus, dismissJustExited };
};
