import type { PlanoStatus } from './PlanoSemanal';
export type { PlanoStatus };

/** Status de revisão do plano pelo coach — espelha `PlanoReviewStatus` do backend. */
export type PlanoReviewStatus = 'AGUARDANDO_REVISAO' | 'APROVADO' | 'REJEITADO';

/** Shape do enum PlanoReviewStatus serializado pelo backend com @JsonFormat(OBJECT). */
export interface PlanoReviewStatusDto {
    value: string;
    label: string;
    description?: string;
    color?: string;
    active?: boolean;
}

/** Extrai o valor string de um reviewStatus que pode chegar como string ou objeto. */
export function resolveReviewStatus(status: string | PlanoReviewStatusDto): PlanoReviewStatus {
    const raw = typeof status === 'string' ? status : status.value;
    return raw as PlanoReviewStatus;
}

/** Shape do enum DiaSemana serializado pelo backend com @JsonFormat(OBJECT). */
export interface DiaSemanaDto {
    value: string;
    label: string;
    short?: string;
    order?: number;
}

/** Etapa de um treino planejado — espelha `EtapaTreinoDto` do backend. */
export interface EtapaTreinoDto {
    ordem?: number;
    tipoEtapa: string;      // "AQUECIMENTO" | "PRINCIPAL" | "INTERVALADO" | "RECUPERACAO" | "DESAQUECIMENTO"
    descricaoEtapa?: string;
    duracaoMin?: number;    // inteiro em minutos
    distanciaKm?: number;
    fcAlvoEtapa?: string;   // meta de FC, e.g. "140-150 bpm"
    ritmoAlvo?: string;     // meta de ritmo, e.g. "5:00-5:15/km"
    repeticoes?: number;
    blocoId?: string;
    blocoRepeticoes?: number;
}

/** Treino planejado resumido para exibição no painel de revisão. */
export interface TreinoPlanejadoDto {
    id?: string;
    dataTreino?: string;
    diaSemana: string | DiaSemanaDto;
    tipoTreino: string;
    distanciaKm: number;
    duracaoMin?: string;       // ISO-8601, e.g. "PT90M" ou "PT1H30M"
    descricao?: string;
    zonaAlvo?: string;
    observacao?: string;
    justificativaIa?: string;
    tssPlanejado?: number;
    percepcaoEsforcoEsperada?: number;
    editadoPeloCoach?: boolean;
    adicionadoPeloCoach?: boolean;
    etapas?: EtapaTreinoDto[];
    /** ID da prova vinculada, quando `tipoTreino = PROVA` (prova-no-plano-semanal). */
    provaId?: string;
}

/** Payload para adicionar treino via POST /coach/planos/{planoId}/treinos. */
export interface TreinoPlanejadoAddPayload {
    tipoTreino: string;
    dataTreino: string;         // ISO-8601 date, e.g. "2026-07-03"
    descricao?: string;
    distanciaKm?: number;
    duracaoMin?: number;        // inteiro em minutos
    zonaAlvo?: string;
    percepcaoEsforcoEsperada?: number;
    tssPlanejado?: number;
    observacoes?: string;
    etapas?: EtapaInputPayload[];
}

/** Etapa simples ou bloco repetido no payload de criação. */
export interface EtapaInputPayload {
    tipoEtapa: string;           // "BLOCO" para blocos repetidos; tipo normal para etapas avulsas
    descricaoEtapa?: string;
    duracaoMin?: number;
    distanciaKm?: number;
    fcAlvoEtapa?: string;
    ritmoAlvo?: string;
    repeticoes?: number;
    blocoRepeticoes?: number;    // somente quando tipoEtapa="BLOCO"
    subEtapas?: EtapaInputPayload[];  // somente quando tipoEtapa="BLOCO"
}

/** Campos editáveis de um treino planejado durante revisão. Campos undefined são ignorados (patch semântico). */
export interface TreinoPlanejadoPatch {
    tipoTreino?: string;
    descricao?: string;
    distanciaKm?: number;
    duracaoMin?: string; // ISO-8601: "PT90M"
    zonaAlvo?: string;
    tssPlanejado?: number;
    percepcaoEsforcoEsperada?: number;
    observacao?: string;
    /**
     * Mesmo tipo do payload de criação: aceita etapas avulsas e `tipoEtapa: 'BLOCO'` com
     * `subEtapas`. Era `EtapaTreinoDto[]`, que não tem `subEtapas` — mais estreito que o contrato
     * real (`TreinoPlanejadoPatchDto.etapas` é `List<EtapaInputDto>` no backend, e já passa por
     * `expandirBloco`). Resquício do cliente curado à mão, não limitação da API.
     */
    etapas?: EtapaInputPayload[];
}

/**
 * Plano semanal retornado pelos endpoints de revisão.
 * Espelha `PlanoSemanalOutputDto` do backend + campos de review.
 */
export interface PlanoSemanalDto {
    id: string;
    semanaInicio: string;
    semanaFim: string;
    volumePlanejadoKm: number;
    volumeRealizadoKm: number;
    volumeAlvoKm: number;
    tsbInicio?: number;
    tsbFim?: number;
    status: PlanoStatus;
    observacoes?: string;
    objetivoSemanal?: string;
    treinosPlanejados?: TreinoPlanejadoDto[];
    reviewStatus: string | PlanoReviewStatusDto;
    reviewComment?: string;
    atletaNome?: string;
    /**
     * Por que um plano aprovado voltou a AGUARDANDO_REVISAO sem o atleta ter mexido no plano —
     * hoje só a prova causa isso (prova-no-plano-semanal, D4). `null`/ausente fora dessa
     * reabertura.
     */
    motivoReabertura?: 'PROVA_INSERIDA' | 'PROVA_REMOVIDA' | null;
}

/** Payload do endpoint POST /{id}/rejeitar. */
export interface PlanoRejectionInput {
    motivo: string;
}
