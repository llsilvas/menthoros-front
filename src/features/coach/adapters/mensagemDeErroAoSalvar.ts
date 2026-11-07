import { ApiError } from '../../../api/core/ApiError';

const MSG_ERRO_SALVAR = 'Não foi possível salvar o treino. Tente de novo.';

/** Erro do próprio front quando o PATCH devolve 200 sem aplicar a data (`useTreinoPlanejado`). */
export class DataNaoAplicadaError extends Error {
    constructor() {
        super('Não foi possível mover o treino: a nova data não foi aplicada.');
        this.name = 'DataNaoAplicadaError';
    }
}

/**
 * 409/422 trazem a mensagem do backend, escrita para o treinador; o resto vira genérica. A data não
 * aplicada também passa: repetir não resolve, e o treinador precisa saber que o move não entrou.
 */
export function mensagemDeErroAoSalvar(err: unknown): string {
    if (err instanceof DataNaoAplicadaError) return err.message;
    if (err instanceof ApiError && (err.status === 409 || err.status === 422)) {
        const message = (err.body as { message?: unknown } | undefined)?.message;
        if (typeof message === 'string' && message.trim()) return message;
    }
    return MSG_ERRO_SALVAR;
}
