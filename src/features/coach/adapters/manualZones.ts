import type { AthleteTrainingZoneDto, AthleteTrainingZonesDto, FaixaZonaManual } from '../../../types/AthleteTrainingZones';
import { formatPace, parsePace } from './zoneAnchors';

export type EixoManual = 'fc' | 'pace';

/** Uma linha editável da tabela: FC em bpm, pace em "m:ss" (De = limite mais rápido). */
export interface LinhaManual {
    de: string;
    ate: string;
}

/** Erro por índice de linha (0 = Z1). Vazio = tudo válido. */
export type ErrosManuais = Partial<Record<number, string>>;

// Mesmas regras de AthleteZoneManualValidator no backend (design D4); a autoridade é o backend.
const LIMITES = {
    fc: { zonas: 5, min: 40, max: 230, texto: 'entre 40 e 230 bpm' },
    pace: { zonas: 6, min: 120, max: 900, texto: 'entre 2:00 e 15:00 /km' },
} as const;

type Faixa = { min: number; max: number } | null | undefined;

const faixaDoEixo = (z: AthleteTrainingZoneDto, eixo: EixoManual): Faixa =>
    eixo === 'fc' ? z.fc : z.pace ? { min: z.pace.minSegKm, max: z.pace.maxSegKm } : null;

const texto = (v: number, eixo: EixoManual) => (eixo === 'fc' ? String(v) : formatPace(v));

const linhas = (faixas: Faixa[], eixo: EixoManual): LinhaManual[] =>
    faixas.slice(0, LIMITES[eixo].zonas).map((f) => (f ? { de: texto(f.min, eixo), ate: texto(f.max, eixo) } : { de: '', ate: '' }));

/** Linhas a partir das faixas efetivas — o pré-preenchimento do modo manual. */
export function linhasDasZonas(zonas: AthleteTrainingZoneDto[], eixo: EixoManual): LinhaManual[] {
    return linhas(zonas.map((z) => faixaDoEixo(z, eixo)), eixo);
}

const peloLimiar = (z: AthleteTrainingZoneDto, eixo: EixoManual): Faixa =>
    eixo === 'fc' ? z.fcPeloLimiar : z.pacePeloLimiar ? { min: z.pacePeloLimiar.minSegKm, max: z.pacePeloLimiar.maxSegKm } : null;

/**
 * As faixas que o limiar daria, para "Recalcular a partir do limiar". Eixo em MANUAL usa os campos
 * `*PeloLimiar`; ausentes (ritmo sem pace de limiar) = null, e o Recalcular fica indisponível.
 */
export function faixasDoLimiar(dto: AthleteTrainingZonesDto, eixo: EixoManual): LinhaManual[] | null {
    const manual = dto.modos?.[eixo] === 'MANUAL';
    const faixas = dto.zonas.slice(0, LIMITES[eixo].zonas).map((z) => (manual ? peloLimiar(z, eixo) : faixaDoEixo(z, eixo)));
    return faixas.every((f) => f != null) ? linhas(faixas, eixo) : null;
}

/** O DTO com as faixas pelo limiar no lugar das manuais — a prévia do modo "Calcular pelo limiar". */
export function comFaixasDoLimiar(dto: AthleteTrainingZonesDto): AthleteTrainingZonesDto {
    const fcManual = dto.modos?.fc === 'MANUAL';
    const paceManual = dto.modos?.pace === 'MANUAL';
    if (!fcManual && !paceManual) return dto;
    return {
        ...dto,
        zonas: dto.zonas.map((z) => ({
            ...z,
            fc: fcManual ? (z.fcPeloLimiar ?? null) : z.fc,
            pace: paceManual ? (z.pacePeloLimiar ?? null) : z.pace,
        })),
    };
}

const numero = (t: string, eixo: EixoManual): number | null =>
    eixo === 'fc' ? (/^\d+$/.test(t.trim()) ? Number(t) : null) : parsePace(t);

/** Regras do backend, com a mensagem na linha da zona que invadiu a anterior. */
export function validarFaixasManuais(linhasForm: LinhaManual[], eixo: EixoManual): ErrosManuais {
    const lim = LIMITES[eixo];
    const erros: ErrosManuais = {};
    let anterior: { min: number; max: number } | null = null;
    linhasForm.forEach((l, i) => {
        const min = numero(l.de, eixo);
        const max = numero(l.ate, eixo);
        let atual: { min: number; max: number } | null = null;
        if (min == null || max == null) {
            erros[i] = eixo === 'fc' ? 'Valor inválido: use bpm inteiro' : 'Valor inválido: use m:ss';
        } else if (min < lim.min || max < lim.min || min > lim.max || max > lim.max) {
            erros[i] = `Valores ${lim.texto}`;
        } else if (min >= max) {
            erros[i] = eixo === 'fc'
                ? '"De" precisa ser menor que "Até"'
                : 'O pace mais rápido (De) precisa ser menor que o mais lento (Até)';
        } else {
            atual = { min, max };
            if (anterior && eixo === 'fc' && min < anterior.max) erros[i] = `Z${i + 1} começa dentro da Z${i}`;
            if (anterior && eixo === 'pace' && max > anterior.min) erros[i] = `Z${i + 1} sobrepõe a Z${i}`;
        }
        anterior = atual;
    });
    return erros;
}

/**
 * Barra proporcional e referência (% do limiar digitado) das linhas em edição, como na prévia do
 * modo limiar. Linha incompleta ou invertida ocupa peso 1 e referência "—".
 */
export function previaManual(linhasForm: LinhaManual[], eixo: EixoManual, limiar: number | null) {
    const sufixo = eixo === 'fc' ? 'LTHR' : 'limiar';
    const pct = (v: number) => Math.round((v / (limiar as number)) * 100);
    const faixas = linhasForm.map((l) => {
        const min = numero(l.de, eixo);
        const max = numero(l.ate, eixo);
        return min != null && max != null && min < max ? { min, max } : null;
    });
    return {
        barra: faixas.map((f, i) => ({ numero: i + 1, peso: f ? f.max - f.min : 1 })),
        referencias: faixas.map((f) => (f && limiar ? `${pct(f.min)}–${pct(f.max)}% ${sufixo}` : '—')),
    };
}

/** Linhas já validadas -> faixas do `PUT .../zonas/manuais`. */
export function corpoManual(linhasForm: LinhaManual[], eixo: EixoManual): FaixaZonaManual[] {
    return linhasForm.map((l, i) => ({ zona: i + 1, min: numero(l.de, eixo) as number, max: numero(l.ate, eixo) as number }));
}
