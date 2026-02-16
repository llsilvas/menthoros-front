import type { EtapaTreino } from './TreinoPlanejado';
import { getSafeValue, getSafeNumber } from '../utils/safeValues';

export type TipoEtapa =
    | 'AQUECIMENTO'
    | 'PRINCIPAL'
    | 'INTERVALADO'
    | 'RECUPERACAO'
    | 'DESAQUECIMENTO';

export const TIPO_ETAPA_OPTIONS = [
    { value: 'AQUECIMENTO',    label: 'Aquecimento',    color: '#4CAF50' },
    { value: 'PRINCIPAL',      label: 'Principal',      color: '#2196F3' },
    { value: 'INTERVALADO',    label: 'Intervalado',    color: '#FF5722' },
    { value: 'RECUPERACAO',    label: 'Recuperação',    color: '#FF9800' },
    { value: 'DESAQUECIMENTO', label: 'Desaquecimento', color: '#9E9E9E' },
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
