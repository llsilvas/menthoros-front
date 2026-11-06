import type { ProfileBlock, ZoneKey } from '../../workout/profile/types';

export interface ZonaPredominante {
    zona: ZoneKey;
    segundos: number;
    /** Tempo por zona, só das etapas com zona escolhida. */
    distribuicao: Array<{ zone: ZoneKey; seconds: number }>;
}

/** Abaixo disso a zona é pico incidental, não o caráter do treino. */
const SHARE_MINIMO = 0.15;
const ORDEM: ZoneKey[] = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6'];
const minutos = (segundos: number): number => Math.round(segundos / 60);

/**
 * Zona predominante do treino, **só das etapas cuja zona foi escolhida** (`prescribed`).
 *
 * O `targetZone` do perfil é `null` em todo perfil degradado — basta uma etapa sem zona (um
 * aquecimento, por exemplo) —, e isso apagava a predominante das etapas que o treinador já tinha
 * definido. Zona estimada (`derived`) ou desconhecida não entra: este campo é gravado no plano.
 */
export function zonaPredominante(blocks: ProfileBlock[]): ZonaPredominante | null {
    const segundosPorZona = new Map<ZoneKey, number>();
    for (const b of blocks) {
        if (b.confidence !== 'prescribed') continue;
        segundosPorZona.set(b.zone, (segundosPorZona.get(b.zone) ?? 0) + b.durationSec);
    }
    const total = [...segundosPorZona.values()].reduce((a, b) => a + b, 0);
    if (total <= 0) return null;

    const distribuicao = [...segundosPorZona.entries()]
        .map(([zone, seconds]) => ({ zone, seconds }))
        .sort((a, b) => ORDEM.indexOf(a.zone) - ORDEM.indexOf(b.zone));
    const alvo = distribuicao
        .filter((d) => d.seconds / total >= SHARE_MINIMO)
        .reduce<{ zone: ZoneKey; seconds: number } | null>(
            (maior, d) => (!maior || ORDEM.indexOf(d.zone) > ORDEM.indexOf(maior.zone) ? d : maior),
            null,
        );
    return alvo ? { zona: alvo.zone, segundos: alvo.seconds, distribuicao } : null;
}

export function minutosNaZonaAlvo(z: ZonaPredominante | null): number | null {
    return z ? minutos(z.segundos) : null;
}

/** "24 min em Z5, 38 min em Z1": a zona alvo e a que mais tempo toma depois dela. */
export function detalheDaZonaPredominante(z: ZonaPredominante | null): string | null {
    if (!z) return null;
    const outra = [...z.distribuicao]
        .filter((d) => d.zone !== z.zona)
        .sort((a, b) => b.seconds - a.seconds)[0];
    const partes = [`${minutos(z.segundos)} min em ${z.zona}`];
    if (outra) partes.push(`${minutos(outra.seconds)} min em ${outra.zone}`);
    return partes.join(', ');
}

/**
 * "67% Z1–Z2 · 33% Z5": tempo por zona sobre o tempo **total** das etapas, não só do tempo com zona
 * — senão 5 min classificados num treino de 60 virariam 100%. O resto aparece como "sem zona".
 * Zonas vizinhas contíguas viram uma faixa; percentuais inteiros fecham 100 pelo maior resto.
 * `null` sem nenhuma zona escolhida.
 */
export function distribuicaoDeZonas(blocks: ProfileBlock[]): string | null {
    const total = blocks.reduce((soma, b) => soma + b.durationSec, 0);
    const porZona = new Map<ZoneKey, number>();
    for (const b of blocks) {
        if (b.confidence !== 'prescribed') continue;
        porZona.set(b.zone, (porZona.get(b.zone) ?? 0) + b.durationSec);
    }
    if (total <= 0 || porZona.size === 0) return null;

    const faixas: Array<{ de: ZoneKey; ate: ZoneKey; segundos: number }> = [];
    for (const zona of ORDEM) {
        const segundos = porZona.get(zona);
        if (!segundos) continue;
        const anterior = faixas[faixas.length - 1];
        if (anterior && ORDEM.indexOf(zona) === ORDEM.indexOf(anterior.ate) + 1) {
            anterior.ate = zona;
            anterior.segundos += segundos;
        } else {
            faixas.push({ de: zona, ate: zona, segundos });
        }
    }
    const rotulos = faixas.map((f) => (f.de === f.ate ? f.de : `${f.de}–${f.ate}`));
    const segundos = faixas.map((f) => f.segundos);
    const semZona = total - segundos.reduce((a, b) => a + b, 0);
    if (semZona > 0) {
        rotulos.push('sem zona');
        segundos.push(semZona);
    }
    return percentuaisInteiros(segundos, total)
        .map((pct, i) => `${pct === 0 ? '<1' : pct}% ${rotulos[i]}`)
        .join(' · ');
}

/** Maior resto: os inteiros somam 100 mesmo quando cada parte arredonda para baixo. */
export function percentuaisInteiros(partes: number[], total: number): number[] {
    const exatos = partes.map((p) => (p / total) * 100);
    const inteiros = exatos.map(Math.floor);
    let falta = 100 - inteiros.reduce((a, b) => a + b, 0);
    exatos
        .map((v, i) => ({ i, resto: v - inteiros[i] }))
        .sort((a, b) => b.resto - a.resto)
        .forEach(({ i }) => { if (falta > 0) { inteiros[i] += 1; falta -= 1; } });
    return inteiros;
}
