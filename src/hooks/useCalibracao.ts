import { useCallback, useState } from 'react';
import { OnboardingService } from '../api/services/OnboardingService';
import { UsuarioService } from '../api/services/UsuarioService';
import type { CalibrationStatus } from '../types/Calibracao';

const CALIBRACAO_STORAGE_KEY = 'menthoros:onboarding:emCalibracao';

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
            const me = await UsuarioService.getMe();
            if (!me.atletaId) {
                setStatus(null);
                return;
            }
            const atual = await OnboardingService.obterStatusCalibracao(me.atletaId);
            const estavaEmCalibracao = localStorage.getItem(CALIBRACAO_STORAGE_KEY) === 'true';

            if (atual) {
                localStorage.setItem(CALIBRACAO_STORAGE_KEY, 'true');
                setJustExited(false);
            } else if (estavaEmCalibracao) {
                localStorage.removeItem(CALIBRACAO_STORAGE_KEY);
                setJustExited(true);
            }
            setStatus(atual ?? null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar status de calibração'));
        } finally {
            setLoading(false);
        }
    }, []);

    const dismissJustExited = useCallback(() => setJustExited(false), []);

    return { status, justExited, loading, error, fetchStatus, dismissJustExited };
};
