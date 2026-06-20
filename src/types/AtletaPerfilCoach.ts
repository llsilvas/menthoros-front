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
    diaSemana: string;
    tipoTreino: string;
    distanciaKm: number;
    statusExecucao: string;
}

/** Plano semanal vigente do atleta. */
export interface PlanoVigenteDto {
    planoId: string;
    semanaInicio: string;
    semanaFim: string;
    reviewStatus: 'APROVADO' | 'AGUARDANDO_REVISAO' | 'REJEITADO';
    treinos: TreinoPlanejadoResumoDto[];
}

/** Sinal recente da fila de atenção do coach para este atleta. */
export interface SinalRecenteDto {
    motivo: string;
    severidade: string;
    geradoEm: string;
    acaoSugerida: string;
    sugestaoId: string | null;
}

/** Sugestão recente gerada pelo job para este atleta. */
export interface SugestaoRecenteDto {
    id: string;
    tipo: string;
    status: string;
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
    objetivo: string | null;
    provaAlvo: string | null;
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
