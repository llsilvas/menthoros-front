import { describe, expect, it } from 'vitest';
import { faixaFcTipica } from './etapaFcTipica';
import type { AthleteTrainingZoneDto } from '../../../types/AthleteTrainingZones';

const fc = (min: number, max: number) => ({ min, max });
const ZONAS: AthleteTrainingZoneDto[] = [
    { numero: 1, nome: 'Z1', fc: fc(126, 143) },
    { numero: 2, nome: 'Z2', fc: fc(143, 150) },
    { numero: 3, nome: 'Z3', fc: fc(150, 158) },
    { numero: 4, nome: 'Z4', fc: fc(158, 168) },
    { numero: 5, nome: 'Z5', fc: fc(168, 178) },
    { numero: 6, nome: 'Z6' },
];

describe('faixaFcTipica (porte de EtapaFcValidator.zonaEsperadaFC)', () => {
    it.each([
        ['AQUECIMENTO', undefined, [126, 143]],
        ['DESAQUECIMENTO', 'LONGO', [126, 143]],
        ['RECUPERACAO', 'FARTLEK', [126, 150]],
        ['RECUPERACAO', 'FACIL', [126, 143]],
        ['PRINCIPAL', 'REGENERATIVO', [126, 150]],
        ['PRINCIPAL', 'CONTINUO', [143, 158]],
        ['PRINCIPAL', 'LONGO', [143, 158]],
        ['PRINCIPAL', 'FARTLEK', [143, 168]],
        ['PRINCIPAL', 'TEMPO_RUN', [150, 168]],
        ['PRINCIPAL', 'INTERVALADO', [158, 178]],
        ['PRINCIPAL', undefined, [143, 168]],
        ['INTERVALADO', 'FARTLEK', [143, 168]],
        ['INTERVALADO', 'FACIL', [143, 158]],
        ['INTERVALADO', 'INTERVALADO', [158, 178]],
    ] as const)('%s em treino %s espera %j', (etapa, treino, esperado) => {
        expect(faixaFcTipica(etapa, treino, ZONAS)).toEqual({ min: esperado[0], max: esperado[1] });
    });

    it('tipo desconhecido ou sem zonas de FC devolve null', () => {
        expect(faixaFcTipica('OUTRO', undefined, ZONAS)).toBeNull();
        expect(faixaFcTipica('PRINCIPAL', undefined, [])).toBeNull();
    });
});
