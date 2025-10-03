export interface TreinoRealizado {
    atletaId: string;
    planoSemanalId: string;
    treinoPlanejadoId: string;
    cadenciaMedia?: number;
    dataTreino: string;
    diaSemana?: string;
    tipoTreino: string;
    duracaoMin: number;
    distanciaKm: number;
    fcMedia: number;
    fcMax?: number;
    ritmoMedio: string;
    potenciaMedia?: number;
    comentario?: string;
    fonteDados?: string;
    status: string;
    percepcaoEsforco?: number;
    externalId?: string;
    tempoExecucaoSegundos?: number;
    elevacaoTotalMetros: number;
}

export interface CreateTreinoRealizado {
    atletaId: string;
    planoSemanalId: string;
    treinoPlanejadoId: string;
    cadenciaMedia?: number;
    dataTreino: string;
    diaSemana?: string;
    tipoTreino: string;
    duracaoMin: number;
    distanciaKm: number;
    fcMedia: number;
    fcMax?: number;
    ritmoMedio: string;
    potenciaMedia?: number;
    comentario?: string;
    fonteDados?: string;
    status: string;
    percepcaoEsforco?: number;
    externalId?: string;
    tempoExecucaoSegundos?: number;
    elevacaoTotalMetros: number;
}

export interface UpdateTreinoRealizado extends Partial<CreateTreinoRealizado> {
    id: string;
}


