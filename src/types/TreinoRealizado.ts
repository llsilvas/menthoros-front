export interface TreinoRealizado {
    atletaId: string;
    planoSemanalId: string;
    treinoPlanejadoId: string;
    dataTreino: string;
    diaSemana?: string;
    tipoTreino: string;
    descricao?: string;
    zonaAlvo?: string;
    duracaoMin: string;
    distanciaKm: number;
    ritmoAlvo?: string;
    ritmoMedio?: string;
    elevacaoGanhoMetros?: number;
    elevacaoPerdaMetros?: number;
    observacao?: string;
    fcMedia: number;
    fcMax?: number;
    cadenciaMedia?: number;
    potenciaMedia?: number;
    velocidadeMedia?: number;
    percepcaoEsforco?: number;
    feedbackAtleta?: string;
    qualidadeSonoNoiteAnterior?: number;
    nivelEstresse?: number;
    fonteDados?: string;
    status: string;
    externalId?: string;
}

export interface CreateTreinoRealizado {
    atletaId: string;
    planoSemanalId: string;
    treinoPlanejadoId: string;
    dataTreino: string;
    diaSemana?: string;
    tipoTreino: string;
    descricao?: string;
    zonaAlvo?: string;
    duracaoMin: string;
    distanciaKm: number;
    ritmoAlvo?: string;
    ritmoMedio?: string;
    elevacaoGanhoMetros?: number;
    elevacaoPerdaMetros?: number;
    observacao?: string;
    fcMedia: number;
    fcMax?: number;
    cadenciaMedia?: number;
    potenciaMedia?: number;
    velocidadeMedia?: number;
    percepcaoEsforco?: number;
    feedbackAtleta?: string;
    qualidadeSonoNoiteAnterior?: number;
    nivelEstresse?: number;
    fonteDados?: string;
    status: string;
    externalId?: string;
}

export interface UpdateTreinoRealizado extends Partial<CreateTreinoRealizado> {
    id: string;
}


