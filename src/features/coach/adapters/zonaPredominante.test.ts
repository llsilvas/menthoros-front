import { describe, expect, it } from 'vitest';
import { detalheDaZonaPredominante, minutosNaZonaAlvo } from './zonaPredominante';
import type { ProfileMetrics } from '../../workout/profile/types';

const metricas = (over: Partial<ProfileMetrics>): Pick<ProfileMetrics, 'targetZone' | 'targetZoneSeconds' | 'distribution'> => ({
    targetZone: 'Z5',
    targetZoneSeconds: 1440,
    distribution: [
        { zone: 'Z1', seconds: 2280, share: 0.61 },
        { zone: 'Z5', seconds: 1440, share: 0.39 },
    ],
    ...over,
});

describe('detalheDaZonaPredominante', () => {
    it('lista os minutos na zona alvo e na maior das outras', () => {
        expect(detalheDaZonaPredominante(metricas({}))).toBe('24 min em Z5, 38 min em Z1');
    });

    it('com uma zona só, só ela', () => {
        expect(detalheDaZonaPredominante(metricas({ distribution: [{ zone: 'Z5', seconds: 1440, share: 1 }] }))).toBe('24 min em Z5');
    });

    it('sem zona alvo derivável devolve null', () => {
        expect(detalheDaZonaPredominante(metricas({ targetZone: null, targetZoneSeconds: 0 }))).toBeNull();
    });
});

describe('minutosNaZonaAlvo', () => {
    it('arredonda os segundos para minutos', () => {
        expect(minutosNaZonaAlvo(metricas({ targetZoneSeconds: 1470 }))).toBe(25);
        expect(minutosNaZonaAlvo(metricas({ targetZone: null, targetZoneSeconds: 0 }))).toBeNull();
    });
});
