/** View model da tela de execução do treino realizado (coach-ver-treino-realizado, D4/D5). */

/** `ok` dentro da tolerância, `atencao` fora, `neutro` sem critério ou sem um dos lados. */
export type TomDiferenca = 'ok' | 'atencao' | 'neutro';

export interface LinhaComparativo {
    rotulo: string;
    planejado: string;
    realizado: string;
    /** Sempre em texto: a cor nunca é o único sinal. */
    diferenca: string;
    tom: TomDiferenca;
}

export interface FaixaZona {
    zona: string;
    segundos: number;
    /** 0–100, arredondado. */
    percentual: number;
    tempo: string;
    limites: string;
    alvo: boolean;
}

export interface ZonasExecucao {
    faixas: FaixaZona[];
    /** `null` quando o planejado não tem zona alvo reconhecida. */
    percentualNoAlvo: number | null;
}

export interface LinhaEtapa {
    rotulo: string;
    distancia: string;
    tempo: string;
    ritmo: string;
    fcMedia: string;
    fcMax: string;
    cadencia: string;
    potencia: string;
    elevacao: string;
}

export interface ItemDadoRelogio {
    rotulo: string;
    valor: string;
}

export interface GrupoDadosRelogio {
    titulo: string;
    itens: ItemDadoRelogio[];
}

export interface ExecucaoTreino {
    comparativo: LinhaComparativo[];
    /** `null` sem `tempoEmZonas` no detalhe. */
    zonas: ZonasExecucao | null;
    etapas: LinhaEtapa[];
    /** Valores da sessão, não a soma das voltas (CA11); `null` sem voltas. */
    total: LinhaEtapa | null;
    grupos: GrupoDadosRelogio[];
}

/** O que o comparativo usa do treino planejado — comum ao resumo do shell e ao card de Planos. */
export interface PlanejadoComparavel {
    distanciaKm?: number | null;
    /** ISO-8601 (`PT60M`), `HH:MM:SS`, ou minutos (legado de Planos). */
    duracaoMin?: string | number | null;
    ritmoAlvo?: string | null;
    zonaAlvo?: string | null;
    percepcaoEsforcoEsperada?: number | null;
}
