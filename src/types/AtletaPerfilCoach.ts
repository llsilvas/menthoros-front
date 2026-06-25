import type { EtapaTreinoDto, PlanoReviewStatusDto } from './PlanoReview';
import type { Prova } from './Prova';

/** Ponto PMC retornado pelo backend (datas como strings ISO). */
export interface PmcPontoRaw {
    data: string;
    ctl: number;
    atl: number;
    tsb: number;
    tss: number;
}

/** Aderência semanal ao plano de treino. */
export interface AderenciasSemanalDto {
    semanaInicio: string;
    totalPlanejado: number;
    totalRealizado: number;
    percentual: number;
}

/** Resumo de um treino planejado na semana vigente. */
export interface TreinoPlanejadoResumoDto {
    id?: string;
    diaSemana: string;
    tipoTreino: string;
    distanciaKm: number;
    statusExecucao: 'PENDENTE' | 'REALIZADO' | 'PERDIDO' | 'CANCELADO';
    duracaoMin?: string;   // ISO-8601, ex: "PT60M" ou "PT1H30M"
    zonaAlvo?: string;
    percepcaoEsforcoEsperada?: number;
    etapas?: EtapaTreinoDto[];
}

/** Plano semanal vigente do atleta. */
export interface PlanoVigenteDto {
    planoId: string;
    semanaInicio: string;
    semanaFim: string;
    reviewStatus: string | PlanoReviewStatusDto;
    treinos: TreinoPlanejadoResumoDto[];
}

/** Sinal recente da fila de atenção do coach para este atleta. */
export interface SinalRecenteDto {
    motivo: string;
    severidade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';
    geradoEm: string;
    acaoSugerida: string;
    sugestaoId: string | null;
}

/** Sugestão recente gerada pelo job para este atleta. */
export interface SugestaoRecenteDto {
    id: string;
    tipo: 'NOVO_PLANO' | 'AJUSTE_PLANO' | 'LONG_RUN' | 'DESCANSO' | 'SIMULADO' | 'RECOVERY';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    criadoEm: string;
}

/** Recorde pessoal do atleta por distância de referência. */
export interface RecordeDto {
    label: string;
    duracaoSeg: number;
    data: string;
    treinoId: string;
}

/** Perfil consolidado de um atleta para o coach (endpoint único agregador). */
export interface AtletaPerfilCoachDto {
    atletaId: string;
    nomeAtleta: string;
    idade?: number | null;
    objetivo: string | null;
    proximaProva: Prova | null;
    provas?: Prova[];
    nivelExperiencia: string | null;
    pmc: PmcPontoRaw[];
    aderenciaSemanal: AderenciasSemanalDto[];
    planoVigente: PlanoVigenteDto | null;
    sinaisRecentes: SinalRecenteDto[];
    sugestoesRecentes: SugestaoRecenteDto[];
    recordes: RecordeDto[];
    geradoEm: string;
    avisos: string[] | null;
}
