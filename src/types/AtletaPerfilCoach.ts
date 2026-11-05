import type { EtapaTreinoDto, PlanoReviewStatusDto } from './PlanoReview';
import type { Prova } from './Prova';
import type { FaixaTsbStatus } from './FaixaTsb';
import type { AthleteBillingStatus } from './Atleta';

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

/** Aderência semanal ao plano de treino. Só semanas com ao menos um treino devido (fix-adherence-count-until-today). */
export interface AderenciasSemanalDto {
    semanaInicio: string;
    totalPlanejado: number;
    totalRealizado: number;
    percentual: number;
}

/**
 * Aderência da semana atual + 3 anteriores, mesma função que alimenta `roster.aderenciaPercentual`
 * (fix-adherence-count-until-today, D5) — roster e perfil concordam por construção. Ausente quando
 * não há treino devido na janela (nunca 0%, ver D6).
 */
export interface Aderencia4SemanasDto {
    realizado: number;
    planejado: number;
    percentual: number;
}

/** Resumo de um treino planejado na semana vigente. */
export interface TreinoPlanejadoResumoDto {
    id?: string;
    diaSemana: string;
    tipoTreino: string;
    /** Ausente quando o treino não prescreve distância. */
    distanciaKm?: number;
    statusExecucao: 'PENDENTE' | 'REALIZADO' | 'PERDIDO' | 'CANCELADO';
    duracaoMin?: string;   // ISO-8601, ex: "PT60M" ou "PT1H30M"
    zonaAlvo?: string;
    percepcaoEsforcoEsperada?: number;
    /** TSS planejado/estimado do treino; ausente quando não calculado. */
    tssPlanejado?: number | null;
    etapas?: EtapaTreinoDto[];
    /** Status de sincronização com o intervals.icu/Garmin (nome do enum StatusSincronizacao). */
    statusSincronizacao?: string;
    /** Indica se o atleta conectou a conta ao intervals.icu. */
    atletaConectadoIntervalsIcu?: boolean;
    /** Atleta tem canal de treinos conectado (Garmin ou intervals.icu). */
    channelConnected?: boolean;
    /** Motivo do erro ou do envio parcial; só em ERRO_VALIDACAO e SINCRONIZADO_PARCIAL. */
    syncError?: string | null;
    /** Envio ao canal em andamento — o reenvio responderia 409. */
    syncInProgress?: boolean;
    /** Treino realizado vinculado; ausente sem vínculo. */
    treinoRealizadoId?: string;
    ritmoAlvo?: string;
    /** Quando o treinador editou o treino depois da aprovação; ausente se nunca editado. */
    editedAfterApprovalAt?: string | null;
    /**
     * Calculado no backend com a regra do PATCH (fuso do atleta, relógio). Ausente em backend
     * anterior ao campo: o front cai na regra antiga (só edita em revisão).
     */
    editable?: boolean;
    /** Por que não é editável em plano aprovado (`NOT_PENDING`, `PAST_DAY`, `TODAY_ON_WATCH`); ausente se editável. */
    editRejection?: string | null;
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

/**
 * Melhor tempo contínuo do atleta por distância de referência (400m-10k), janela rolante de 42
 * dias — diferente de {@link RecordeDto} (PR de treino inteiro): distâncias curtas acontecem
 * dentro de um treino maior.
 */
export interface MelhorEsforcoDto {
    distanciaLabel: string;
    distanciaMetros: number;
    tempoSegundos: number;
    paceLabel: string;
}

/** Limiares de treinamento inferidos pela IA (FC e pace limiar). */
export interface LimiareisInferidosDto {
    fcLimiarEstimado?: number | null;
    paceLimiarEstimadoFormatado?: string | null;
    confiancaInferenciaFc?: 'ALTA' | 'MEDIA' | 'BAIXA' | null;
    confiancaInferenciaPace?: 'ALTA' | 'MEDIA' | 'BAIXA' | null;
    dataInferenciaLimiar?: string | null;
}

/** Km realizados por semana ISO e nas duas janelas de 7 dias (cancelados fora). */
export interface DistanceSummaryDto {
    /** Mesmas semanas de `aderenciaSemanal`, contínuas; 0 onde não houve treino. */
    weekly: Array<{ weekStart: string; distanceKm: number }>;
    last7DaysKm: number;
    previous7DaysKm: number;
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
    /** Melhores esforços por distância (400m-10k), janela de 42 dias; vazio sem intervals.icu. */
    melhoresEsforcos: MelhorEsforcoDto[];
    /** Distingue "atleta sem PRs ainda" (true, `melhoresEsforcos` vazio) de "nunca conectou" (false). */
    melhoresEsforcosIntegracaoConectada: boolean;
    geradoEm: string;
    avisos: string[] | null;
    limiareisInferidos?: LimiareisInferidosDto | null;
    /** Próximo vencimento (menor mensalidade em aberto); ausente junto com billingStatus. */
    nextDueDate?: string;
    /** Derivado em leitura; ausente sem contrato ou sem mensalidade em aberto. Nunca carrega valor. */
    billingStatus?: AthleteBillingStatus;
    /** Treinos realizados dos últimos 7 dias, mais recente primeiro; ausente sem realizados. */
    realizadosRecentes?: RealizadoRecenteDto[];
    /** Ausente em backend anterior ao campo ou quando a consulta falha (`avisos` traz "distanceSummary"). */
    distanceSummary?: DistanceSummaryDto | null;
    /** Ausente sem treino devido na janela (D6) ou em backend anterior ao campo. */
    aderencia4Semanas?: Aderencia4SemanasDto | null;
    /**
     * Relógio informado no onboarding (marca informada, não confirmada). Ausente sem perfil, sem marca,
     * em backend anterior ao campo ou quando a consulta falha (`avisos` traz "relogio").
     */
    relogio?: { marca: string; modelo?: string | null } | null;
    /**
     * Canal de conexão mais recente (garmin-connection, D7): `ativo=false` é revogada/desconectada;
     * ausente = nunca conectou ou backend anterior ao campo.
     */
    conexaoCanal?: ConexaoCanalDto | null;
}

/** Plataforma serializada como objeto (FonteDados é `@JsonFormat(OBJECT)`); `value` é a chave. */
export interface ConexaoCanalDto {
    plataforma: { value: string; label: string };
    ativo: boolean;
    workoutImport: boolean;
    activityExport: boolean;
    lastSyncError?: string | null;
    /** ISO-8601: última atividade recebida pelo canal; ausente = nenhuma chegou ainda. */
    ultimaSincronizacao?: string | null;
}

/** Treino realizado recente, com feedback do atleta quando registrado (athlete-training-loop, D3). */
export interface RealizadoRecenteDto {
    id: string;
    dataTreino: string;
    tipoTreino?: string;
    fonteDados?: { value: string; label: string };
    /** Modelo do dispositivo (Garmin); ausente quando desconhecido. */
    deviceName?: string | null;
    duracaoMin?: number;
    distanciaKm?: number;
    percepcaoEsforco?: number;
    tssCalculado?: number;
    sensacoes?: string[];
    feedbackAtleta?: string;
    /** Ausente = "Como foi?" ainda não respondido. */
    feedbackRegistradoEm?: string;
}
