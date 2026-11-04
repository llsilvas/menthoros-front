import { useCallback, useState } from 'react';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import { ApiError } from '../api/core/ApiError';

const MSG_EM_ANDAMENTO = 'Envio em andamento. Aguarde alguns minutos e tente de novo.';
const MSG_GENERICA = 'Não foi possível reenviar ao relógio. Tente de novo.';

function mensagemDeErro(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.status === 409) return MSG_EM_ANDAMENTO;
        const mensagem = (err.body as { message?: unknown } | undefined)?.message;
        if (err.status === 422 && typeof mensagem === 'string') return mensagem;
    }
    return MSG_GENERICA;
}

/** Reenvio manual dos treinos em erro de um plano aprovado ao relógio (Garmin ou intervals.icu). */
export function useReenviarSincronizacao() {
    const [reenviando, setReenviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    /** Devolve a quantidade de treinos reenviados, ou `null` em erro (mensagem em `erro`). */
    const reenviar = useCallback(async (planoId: string): Promise<number | null> => {
        setReenviando(true);
        setErro(null);
        try {
            const { resent } = await CoachPlanoReviewService.reenviarSincronizacao(planoId);
            return resent;
        } catch (err) {
            setErro(mensagemDeErro(err));
            return null;
        } finally {
            setReenviando(false);
        }
    }, []);

    return { reenviando, erro, reenviar };
}
