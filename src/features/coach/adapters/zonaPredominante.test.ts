import { describe, expect, it } from 'vitest';
import { detalheDaZonaPredominante, distribuicaoDeZonas, minutosNaZonaAlvo, zonaPredominante } from './zonaPredominante';
import type { ProfileBlock, ZoneKey } from '../../workout/profile/types';

const bloco = (zone: ZoneKey, minutos: number, confidence: ProfileBlock['confidence'] = 'prescribed'): ProfileBlock =>
    ({ id: `${zone}-${minutos}`, order: 0, kind: 'steady', durationSec: minutos * 60, label: '', target: { kind: 'none' }, intensityNormalized: 0.5, zone, confidence }) as ProfileBlock;

describe('zonaPredominante', () => {
    it('a maior zona com ao menos 15% do tempo escolhido', () => {
        const z = zonaPredominante([bloco('Z1', 38), bloco('Z5', 24)]);

        expect(z?.zona).toBe('Z5');
        expect(z?.segundos).toBe(24 * 60);
    });

    it('etapa sem zona escolhida não apaga a predominante das outras (era o defeito: tudo virava "—")', () => {
        const z = zonaPredominante([
            bloco('Z2', 10, 'derived'), // aquecimento sem zona: estimativa
            bloco('Z5', 24),
            bloco('Z1', 5, 'unknown'),
        ]);

        expect(z?.zona).toBe('Z5');
        expect(z?.distribuicao).toEqual([{ zone: 'Z5', seconds: 24 * 60 }]);
    });

    it('zona estimada ou desconhecida sozinha não conta: sem zona escolhida, sem predominante', () => {
        expect(zonaPredominante([bloco('Z2', 30, 'derived'), bloco('Z1', 5, 'unknown')])).toBeNull();
        expect(zonaPredominante([])).toBeNull();
    });

    it('zona com menos de 15% do tempo escolhido é pico incidental', () => {
        expect(zonaPredominante([bloco('Z2', 50), bloco('Z5', 5)])?.zona).toBe('Z2');
    });
});

describe('detalheDaZonaPredominante / minutosNaZonaAlvo', () => {
    const z = zonaPredominante([bloco('Z1', 38), bloco('Z5', 24)]);

    it('lista os minutos na zona alvo e na maior das outras', () => {
        expect(detalheDaZonaPredominante(z)).toBe('24 min em Z5, 38 min em Z1');
    });

    it('com uma zona só, só ela', () => {
        expect(detalheDaZonaPredominante(zonaPredominante([bloco('Z5', 24)]))).toBe('24 min em Z5');
    });

    it('arredonda os segundos para minutos', () => {
        expect(minutosNaZonaAlvo(zonaPredominante([bloco('Z5', 24.5)]))).toBe(25);
    });

    it('sem predominante, null', () => {
        expect(detalheDaZonaPredominante(null)).toBeNull();
        expect(minutosNaZonaAlvo(null)).toBeNull();
    });
});

describe('distribuicaoDeZonas', () => {
    it('percentual do tempo total por zona, em ordem crescente', () => {
        expect(distribuicaoDeZonas([bloco('Z5', 10), bloco('Z2', 20)])).toBe('67% Z2 · 33% Z5');
    });

    it('zonas vizinhas contíguas viram uma faixa', () => {
        expect(distribuicaoDeZonas([bloco('Z1', 10), bloco('Z2', 10), bloco('Z5', 10)])).toBe('67% Z1–Z2 · 33% Z5');
        expect(distribuicaoDeZonas([bloco('Z1', 10), bloco('Z2', 10), bloco('Z3', 10)])).toBe('100% Z1–Z3');
    });

    it('tempo sem zona escolhida entra no denominador e aparece como "sem zona"', () => {
        expect(distribuicaoDeZonas([bloco('Z2', 20), bloco('Z1', 10, 'derived')])).toBe('67% Z2 · 33% sem zona');
        expect(distribuicaoDeZonas([bloco('Z2', 5), bloco('Z1', 55, 'unknown')])).toBe('8% Z2 · 92% sem zona');
    });

    it('inteiros fecham 100 pelo maior resto', () => {
        expect(distribuicaoDeZonas([bloco('Z1', 10), bloco('Z3', 10), bloco('Z5', 10)])).toBe('34% Z1 · 33% Z3 · 33% Z5');
    });

    it('sem zona escolhida ou sem tempo, null', () => {
        expect(distribuicaoDeZonas([bloco('Z2', 30, 'derived')])).toBeNull();
        expect(distribuicaoDeZonas([])).toBeNull();
    });
});
