/** Eixo que o relógio controla numa etapa — espelha o enum `AlvoPrimario` do backend. */
export type AlvoPrimario = 'PACE' | 'FC' | 'NENHUM';

/** Origem das faixas de um eixo — espelha o enum `ModoZonas` do backend. */
export type ModoZonas = 'LIMIAR' | 'MANUAL';

/** Faixa de uma zona no `PUT .../zonas/manuais`. FC em bpm; pace em s/km, `min` = limite mais rápido. */
export interface FaixaZonaManual {
    zona: number;
    min: number;
    max: number;
}

/**
 * Corpo de `PUT .../zonas/manuais`. Grupo ausente = não alterar o eixo; `LIMIAR` apaga as faixas
 * manuais do eixo; `MANUAL` exige as faixas em ordem (FC Z1–Z5, pace Z1–Z6).
 */
export interface AthleteZonesManualInput {
    fc?: { modo: ModoZonas; faixas?: FaixaZonaManual[] };
    pace?: { modo: ModoZonas; faixas?: FaixaZonaManual[] };
}

/** Espelha o enum `FonteLimiar` do backend. */
export type FonteLimiar = 'TESTE_CAMPO' | 'PROVA' | 'LABORATORIO' | 'RELOGIO_PLATAFORMA';

/**
 * Corpo de `PUT .../zonas/ancoras` e `POST .../zonas/simulacao`. Grupo ausente = não alterar o eixo;
 * `fc.maxima` ausente/null = manter a máxima vigente. Pace em segundos por km inteiros.
 */
export interface AthleteZoneAnchorsInput {
    fc?: { limiar: number; maxima?: number | null; dataTeste: string; origem?: FonteLimiar | null };
    pace?: { limiarSegKm: number; dataTeste: string; origem?: FonteLimiar | null };
}

/**
 * Espelha `AthleteTrainingZonesOutputDto` (`GET /api/v1/coach/atletas/{atletaId}/zonas`).
 *
 * Campos opcionais chegam como `null`, não ausentes: o `@JsonInclude(NON_NULL)` do record externo não
 * vale para os records aninhados. Toda checagem de presença usa `!= null`.
 */
export interface AthleteTrainingZonesDto {
    modelo: string;
    ancoras: {
        /** Minutos decimais por km (5.00 = 5:00/km). Ausente sem pace de limiar. */
        paceLimiarMinKm?: number | null;
        dataUltimoTestePace?: string | null;
        fcLimiar: number;
        dataUltimoTesteFc?: string | null;
        /** true quando o limiar de FC veio do fallback etário, não de teste. */
        fcLimiarEstimada: boolean;
        /** Origem gravada pelo treinador; null para atletas sem origem. */
        fonteLimiarFc?: FonteLimiar | null;
        fonteLimiarPace?: FonteLimiar | null;
    };
    /** Informativo: o backend não soma esse ajuste às faixas de `zonas`. */
    ajusteFadiga: { segundosPorKm: number; tsbProntidao?: number | null };
    /** O push descarta FC literal acima de `bpm`. */
    fcMaxima: { bpm: number; estimada: boolean };
    disponibilidade: { pace: boolean; fc: boolean; motivoPace?: 'SEM_PACE_LIMIAR' | null };
    /** Faixas efetivas de cada eixo: as manuais quando o eixo está em MANUAL. */
    zonas: AthleteTrainingZoneDto[];
    /** Ausente em respostas anteriores a coach-zonas-manuais: tratar como LIMIAR. */
    modos?: { fc: ModoZonas; pace: ModoZonas } | null;
}

export interface AthleteTrainingZoneDto {
    numero: 1 | 2 | 3 | 4 | 5 | 6;
    nome: string;
    pace?: { minSegKm: number; maxSegKm: number } | null;
    fc?: { min: number; max: number } | null;
    /** `FC_NAO_ESTABILIZA` em Z6. */
    motivoFc?: string | null;
    /** Só com pace em MANUAL e pace de limiar cadastrado: a faixa que o limiar daria. */
    pacePeloLimiar?: { minSegKm: number; maxSegKm: number } | null;
    /** Só com FC em MANUAL (exceto Z6): a faixa que o limiar daria. */
    fcPeloLimiar?: { min: number; max: number } | null;
}
