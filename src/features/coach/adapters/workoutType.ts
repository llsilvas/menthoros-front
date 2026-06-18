/** Tipo de treino exibido na UI do calendário do coach. */
export type WorkoutType =
    | 'easy_run'
    | 'long_run'
    | 'tempo'
    | 'intervals'
    | 'recovery'
    | 'rest'
    | 'strength';

/** Mapa do enum `TipoTreino` do backend (`name()`) para o `WorkoutType` da UI. */
const TIPO_TREINO_TO_WORKOUT: Readonly<Record<string, WorkoutType>> = {
    REGENERATIVO: 'recovery',
    FACIL: 'easy_run',
    CONTINUO: 'easy_run',
    LONGO: 'long_run',
    TEMPO_RUN: 'tempo',
    PROVA: 'tempo',
    INTERVALADO: 'intervals',
    TIRO: 'intervals',
    FARTLEK: 'intervals',
    SUBIDA: 'intervals',
};

/**
 * Converte o `tipoTreino` do backend no `WorkoutType` da UI.
 * Tipo ausente ou desconhecido cai no default seguro `easy_run` (não lança).
 */
export function mapTipoTreino(tipoTreino?: string): WorkoutType {
    if (!tipoTreino) return 'easy_run';
    return TIPO_TREINO_TO_WORKOUT[tipoTreino] ?? 'easy_run';
}
