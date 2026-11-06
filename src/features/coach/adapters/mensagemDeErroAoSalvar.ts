import { ApiError } from '../../../api/core/ApiError';

const MSG_ERRO_SALVAR = 'Não foi possível salvar o treino. Tente de novo.';

/** 409/422 trazem a mensagem do backend, escrita para o treinador; o resto vira genérica. */
export function mensagemDeErroAoSalvar(err: unknown): string {
    if (err instanceof ApiError && (err.status === 409 || err.status === 422)) {
        const message = (err.body as { message?: unknown } | undefined)?.message;
        if (typeof message === 'string' && message.trim()) return message;
    }
    return MSG_ERRO_SALVAR;
}
