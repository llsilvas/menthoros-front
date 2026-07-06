/** Modo de geração do plano (espelha ModoGeracaoPlano.java — serializa como string). */
export type ModoGeracaoPlano = 'PROXIMA_SEMANA' | 'SEMANA_ATUAL';

/** Estado do job de geração em lote (espelha BatchJobStatus.java — enum plano, serializa como string). */
export type BatchJobStatus = 'PENDENTE' | 'EM_PROGRESSO' | 'CONCLUIDO' | 'CONCLUIDO_COM_ERROS';

/** Plano gerado com sucesso para um atleta do lote. */
export interface BatchGeradoItem {
    atletaId: string;
    planoId: string;
    atletaNome: string;
}

/** Erro na geração do plano de um atleta (mensagem já sanitizada pelo backend). */
export interface BatchErroItem {
    atletaId: string;
    motivo: string;
}

/**
 * Confirmação do disparo do lote (corpo do 202).
 * Espelha BatchLoteAceitoOutputDto (POST /api/v1/coach/planos/gerar-lote).
 */
export interface BatchLoteAceito {
    jobId: string;
    totalAtletas: number;
}

/**
 * Estado atual de um job de geração em lote (retorno do polling).
 * Espelha BatchJobStatusOutputDto (GET /api/v1/coach/planos/lote/{jobId}).
 * Os detalhes (`geradosDetalhes`/`errosDetalhes`) vêm vazios até o estado terminal.
 */
export interface BatchPlanJobStatus {
    jobId: string;
    status: BatchJobStatus;
    totalAtletas: number;
    gerados: number;
    erros: number;
    geradosDetalhes: BatchGeradoItem[];
    errosDetalhes: BatchErroItem[];
}

/** Estados terminais do job (o polling para quando atingir um deles). */
export const BATCH_JOB_STATUS_TERMINAL: readonly BatchJobStatus[] = ['CONCLUIDO', 'CONCLUIDO_COM_ERROS'];

/** True quando o job atingiu um estado terminal. */
export function isBatchJobTerminal(status: BatchJobStatus): boolean {
    return BATCH_JOB_STATUS_TERMINAL.includes(status);
}
