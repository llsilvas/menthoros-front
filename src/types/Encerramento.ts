import type { PlanoStatus } from './PlanoSemanal';

/** Origem do encerramento de uma semana (espelha OrigemEncerramento.java — serializa como string). */
export type OrigemEncerramento = 'ON_DEMAND' | 'AUTOMATICO';

/**
 * `PlanoStatus` chega como objeto ({value,label,...}) por causa do @JsonFormat(OBJECT) no backend.
 * Ler sempre via `getSafeValue`. O union aceita a forma string (usada nos mocks/fixtures).
 */
export type PlanoStatusValue = PlanoStatus | { value: PlanoStatus; label?: string; [key: string]: unknown };

/**
 * Resumo do encerramento da semana de um plano.
 * Espelha EncerramentoSemanaOutputDto (POST /api/v1/coach/planos/{planoId}/encerrar-semana).
 * Obs.: `novoStatus` chega como objeto ({value,label,...}) por causa do @JsonFormat(OBJECT) no
 * backend — normalizar com `getSafeValue` ao exibir.
 */
export interface EncerramentoSemanaResult {
    planoId: string;
    novoStatus: PlanoStatusValue;
    treinosFinalizados: number;
    treinosPerdidos: string[];
    prontoParaProximaSemana: boolean;
    origem: OrigemEncerramento;
    aviso?: string | null;
}

/** Atleta cujo encerramento falhou no lote (mensagem já sanitizada pelo backend). */
export interface EncerramentoFalhaAtleta {
    atletaId: string;
    motivo: string;
}

/**
 * Resumo consolidado do encerramento em lote da assessoria (ou da sua projeção/preview).
 * Espelha EncerramentoLoteOutputDto (POST /api/v1/coach/semanas/encerrar-lote[/preview]).
 */
export interface EncerramentoLoteResult {
    atletasProcessados: number;
    atletasSemPlano: number;
    planosConcluidos: number;
    treinosPerdidosTotal: number;
    resultados: EncerramentoSemanaResult[];
    falhas: EncerramentoFalhaAtleta[];
}
