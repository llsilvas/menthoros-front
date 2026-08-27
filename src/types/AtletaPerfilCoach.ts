import type { EtapaTreinoDto, PlanoReviewStatusDto } from './PlanoReview';
import type { Prova } from './Prova';
import type { FaixaTsbStatus } from './FaixaTsb';
import type { StatusVencimentoPlano, TipoPlanoAtleta } from './Atleta';

/** Ponto PMC retornado pelo backend (datas como strings ISO). */
export interface PmcPontoRaw {
    data: string;
    ctl: number;
    atl: number;
    tsb: number;
    tss: number;
    /** Faixa de forma resolvida pelo backend a partir do TSB; ausente quando sem TSB. */
    statusForma?: FaixaTsbStatus;
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
    /** Status de sincronização com o intervals.icu/Garmin (nome do enum StatusSincronizacao). */
    statusSincronizacao?: string;
    /** Indica se o atleta conectou a conta ao intervals.icu. */
    atletaConectadoIntervalsIcu?: boolean;
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

/** Limiares de treinamento inferidos pela IA (FC e pace limiar). */
export interface LimiareisInferidosDto {
    fcLimiarEstimado?: number | null;
    paceLimiarEstimadoFormatado?: string | null;
    confiancaInferenciaFc?: 'ALTA' | 'MEDIA' | 'BAIXA' | null;
    confiancaInferenciaPace?: 'ALTA' | 'MEDIA' | 'BAIXA' | null;
    dataInferenciaLimiar?: string | null;
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
    limiareisInferidos?: LimiareisInferidosDto | null;
    /** Tipo de plano do atleta com a assessoria; ausente quando não cadastrado. */
    tipoPlanoAtleta?: TipoPlanoAtleta;
    /** Data de vencimento do plano do atleta com a assessoria; ausente quando não cadastrado. */
    dataVencimentoPlano?: string;
    /** Status de vencimento derivado; ausente quando dataVencimentoPlano não cadastrada. */
    statusVencimentoPlano?: StatusVencimentoPlano;
    /** Treinos realizados dos últimos 7 dias, mais recente primeiro; ausente sem realizados. */
    realizadosRecentes?: RealizadoRecenteDto[];
}

/** Treino realizado recente, com feedback do atleta quando registrado (athlete-training-loop, D3). */
export interface RealizadoRecenteDto {
    id: string;
    dataTreino: string;
    tipoTreino?: string;
    fonteDados?: string;
    duracaoMin?: number;
    distanciaKm?: number;
    percepcaoEsforco?: number;
    sensacoes?: string[];
    feedbackAtleta?: string;
    /** Ausente = "Como foi?" ainda não respondido. */
    feedbackRegistradoEm?: string;
}
