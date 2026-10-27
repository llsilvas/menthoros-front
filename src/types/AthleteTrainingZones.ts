/** Eixo que o relógio controla numa etapa — espelha o enum `AlvoPrimario` do backend. */
export type AlvoPrimario = 'PACE' | 'FC' | 'NENHUM';

/** Espelha `AthleteTrainingZonesOutputDto` (`GET /api/v1/coach/atletas/{atletaId}/zonas`). */
export interface AthleteTrainingZonesDto {
    modelo: string;
    ancoras: {
        /** Minutos decimais por km (5.00 = 5:00/km). Ausente sem pace de limiar. */
        paceLimiarMinKm?: number;
        dataUltimoTestePace?: string;
        fcLimiar: number;
        dataUltimoTesteFc?: string;
        /** true quando o limiar de FC veio do fallback etário, não de teste. */
        fcLimiarEstimada: boolean;
    };
    /** Informativo: o backend não soma esse ajuste às faixas de `zonas`. */
    ajusteFadiga: { segundosPorKm: number; tsbProntidao?: number };
    /** O push descarta FC literal acima de `bpm`. */
    fcMaxima: { bpm: number; estimada: boolean };
    disponibilidade: { pace: boolean; fc: boolean; motivoPace?: 'SEM_PACE_LIMIAR' };
    zonas: AthleteTrainingZoneDto[];
}

export interface AthleteTrainingZoneDto {
    numero: 1 | 2 | 3 | 4 | 5 | 6;
    nome: string;
    pace?: { minSegKm: number; maxSegKm: number };
    fc?: { min: number; max: number };
    /** `FC_NAO_ESTABILIZA` em Z6. */
    motivoFc?: string;
}
