import type { ConexaoCanalDto } from '../../../types/AtletaPerfilCoach';

/** Canal de treinos do atleta, como o backend serializa a plataforma. */
export type WatchChannel = 'GARMIN' | 'INTERVALS_ICU';

export const NOME_CANAL: Record<WatchChannel, string> = {
    GARMIN: 'Garmin Connect',
    INTERVALS_ICU: 'intervals.icu',
};

/**
 * Canal que recebe o treino editado (coach-editar-treino-aprovado, D6): só conexão ativa. Revogada
 * conta como relógio para travar o treino de hoje, mas isso o backend já resolve em `editable`.
 */
export function buildWatchChannelFromConexao(conexao: ConexaoCanalDto | null | undefined): WatchChannel | null {
    if (!conexao?.ativo) return null;
    const plataforma = conexao.plataforma?.value;
    return plataforma === 'GARMIN' || plataforma === 'INTERVALS_ICU' ? plataforma : null;
}

const ROTULO_RECUSA: Record<string, string> = {
    PAST_DAY: 'Treino de dia passado — não editável',
    TODAY_ON_WATCH: 'Treino de hoje já está no relógio',
};

const ROTULO_EXECUCAO: Record<string, string> = {
    REALIZADO: 'Treino realizado — não editável',
    PERDIDO: 'Treino perdido — não editável',
    CANCELADO: 'Treino cancelado — não editável',
};

/**
 * Rótulo do cadeado de treino travado em plano aprovado. O motivo vem do backend (`editRejection`),
 * que decide pelo dia do atleta; o front só escolhe o texto. `NOT_PENDING` detalha pela execução.
 */
export function buildLockLabelFromRejection(editRejection: string | null | undefined, statusExecucao: string): string {
    if (editRejection && ROTULO_RECUSA[editRejection]) return ROTULO_RECUSA[editRejection];
    return ROTULO_EXECUCAO[statusExecucao] ?? 'Treino não editável';
}
