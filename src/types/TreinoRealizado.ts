import type { EtapaTreino } from './TreinoPlanejado';
import { getSafeValue, getSafeNumber } from '../utils/safeValues';
import { surface, semantic } from '../theme/tokens';

export type TipoEtapa =
    | 'AQUECIMENTO'
    | 'PRINCIPAL'
    | 'INTERVALADO'
    | 'RECUPERACAO'
    | 'DESAQUECIMENTO';

export const TIPO_ETAPA_OPTIONS = [
    { value: 'AQUECIMENTO',    label: 'Aquecimento',    color: semantic.success[500] },
    { value: 'PRINCIPAL',      label: 'Principal',      color: semantic.info[500] },
    { value: 'INTERVALADO',    label: 'Intervalado',    color: semantic.danger[500] },
    { value: 'RECUPERACAO',    label: 'Recuperação',    color: semantic.warning[500] },
    { value: 'DESAQUECIMENTO', label: 'Desaquecimento', color: surface[500] },
] as const;

/** Dados de referência da etapa planejada (somente exibição, não enviado ao backend) */
export interface EtapaPlanejadaRef {
    duracaoMin?: number;
    distanciaKm?: number;
    fcAlvoEtapa?: string;
    ritmoAlvo?: string;
    repeticoes?: number;
}

export interface EtapaRealizadaInput {
    etapaPlanejadaId?: string;
    ordem: number;
    tipoEtapa?: TipoEtapa;
    descricao?: string;
    duracao?: string;
    distanciaKm?: number;
    fcMedia?: number;
    fcMax?: number;
    paceMedia?: string;
    velocidadeMedia?: number;
    percepcaoEsforco?: number;
    cadenciaMedia?: number;
    potenciaMedia?: number;
    observacao?: string;
    /** Referência da etapa planejada — usado apenas na UI, removido antes do envio */
    _planejado?: EtapaPlanejadaRef;
}

export function criarEtapasFromPlanejadas(etapas: EtapaTreino[]): EtapaRealizadaInput[] {
    const sorted = [...etapas].sort(
        (a, b) => getSafeNumber(a.ordem) - getSafeNumber(b.ordem)
    );
    return sorted.map((ep, index) => ({
        etapaPlanejadaId: ep.id,
        ordem: index + 1,
        tipoEtapa: (getSafeValue(ep.tipoEtapa) as TipoEtapa) || undefined,
        descricao: ep.descricaoEtapa || undefined,
        _planejado: {
            duracaoMin: ep.duracaoMin,
            distanciaKm: ep.distanciaKm,
            fcAlvoEtapa: ep.fcAlvoEtapa,
            ritmoAlvo: ep.ritmoAlvo,
            repeticoes: ep.repeticoes,
        },
    }));
}

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
    etapasRealizadas?: EtapaRealizadaInput[];
    /** Decoupling aeróbico Pa:HR (% de queda de eficiência da 1ª p/ 2ª metade); ausente quando não aplicável. */
    decouplingPercentual?: number;
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
    etapasRealizadas?: EtapaRealizadaInput[];
}

export interface UpdateTreinoRealizado extends Partial<CreateTreinoRealizado> {
    id: string;
}
