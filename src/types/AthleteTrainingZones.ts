/** Eixo que o relógio controla numa etapa — espelha o enum `AlvoPrimario` do backend. */
export type AlvoPrimario = 'PACE' | 'FC' | 'NENHUM';

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
    };
    /** Informativo: o backend não soma esse ajuste às faixas de `zonas`. */
    ajusteFadiga: { segundosPorKm: number; tsbProntidao?: number | null };
    /** O push descarta FC literal acima de `bpm`. */
    fcMaxima: { bpm: number; estimada: boolean };
    disponibilidade: { pace: boolean; fc: boolean; motivoPace?: 'SEM_PACE_LIMIAR' | null };
    zonas: AthleteTrainingZoneDto[];
}

export interface AthleteTrainingZoneDto {
    numero: 1 | 2 | 3 | 4 | 5 | 6;
    nome: string;
    pace?: { minSegKm: number; maxSegKm: number } | null;
    fc?: { min: number; max: number } | null;
    /** `FC_NAO_ESTABILIZA` em Z6. */
    motivoFc?: string | null;
}
