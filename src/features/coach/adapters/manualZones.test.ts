import { describe, expect, it } from 'vitest';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import { comFaixasDoLimiar, corpoManual, faixasDoLimiar, linhasDasZonas, previaManual, validarFaixasManuais } from './manualZones';

const ZONAS: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 186, estimada: false },
    disponibilidade: { pace: true, fc: true },
    modos: { fc: 'LIMIAR', pace: 'LIMIAR' },
    zonas: [
        { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 } },
        { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
        { numero: 3, nome: 'Tempo', pace: { minSegKm: 300, maxSegKm: 315 }, fc: { min: 150, max: 158 } },
        { numero: 4, nome: 'Limiar', pace: { minSegKm: 285, maxSegKm: 300 }, fc: { min: 158, max: 168 } },
        { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 } },
        { numero: 6, nome: 'Sprint', pace: { minSegKm: 246, maxSegKm: 270 }, motivoFc: 'FC_NAO_ESTABILIZA' },
    ],
};

const PACE_MANUAL: AthleteTrainingZonesDto = {
    ...ZONAS,
    modos: { fc: 'LIMIAR', pace: 'MANUAL' },
    zonas: ZONAS.zonas.map((z) => ({
        ...z,
        pacePeloLimiar: z.pace,
        pace: z.pace ? { minSegKm: z.pace.minSegKm + 5, maxSegKm: z.pace.maxSegKm + 5 } : null,
    })),
};

describe('linhasDasZonas', () => {
    it('FC: cinco linhas em bpm, sem a Z6', () => {
        const linhas = linhasDasZonas(ZONAS.zonas, 'fc');

        expect(linhas).toHaveLength(5);
        expect(linhas[1]).toEqual({ de: '143', ate: '150' });
    });

    it('pace: seis linhas em m:ss, De = limite mais rápido', () => {
        const linhas = linhasDasZonas(ZONAS.zonas, 'pace');

        expect(linhas).toHaveLength(6);
        expect(linhas[1]).toEqual({ de: '5:15', ate: '5:45' });
    });

    it('sem faixa no eixo, linhas vazias', () => {
        const semPace = ZONAS.zonas.map((z) => ({ ...z, pace: null }));

        expect(linhasDasZonas(semPace, 'pace')[0]).toEqual({ de: '', ate: '' });
    });
});

describe('faixasDoLimiar / comFaixasDoLimiar', () => {
    it('eixo em LIMIAR: as faixas efetivas já são as do limiar', () => {
        expect(faixasDoLimiar(ZONAS, 'pace')?.[1]).toEqual({ de: '5:15', ate: '5:45' });
    });

    it('eixo em MANUAL: usa pacePeloLimiar, não a faixa manual', () => {
        expect(faixasDoLimiar(PACE_MANUAL, 'pace')?.[1]).toEqual({ de: '5:15', ate: '5:45' });
    });

    it('eixo em MANUAL sem faixa pelo limiar (sem pace de limiar): null', () => {
        const semLimiar = { ...PACE_MANUAL, zonas: PACE_MANUAL.zonas.map((z) => ({ ...z, pacePeloLimiar: null })) };

        expect(faixasDoLimiar(semLimiar, 'pace')).toBeNull();
    });

    it('comFaixasDoLimiar troca a faixa manual pela do limiar só no eixo manual', () => {
        const dto = comFaixasDoLimiar(PACE_MANUAL);

        expect(dto.zonas[1].pace).toEqual({ minSegKm: 315, maxSegKm: 345 });
        expect(dto.zonas[1].fc).toEqual({ min: 143, max: 150 });
    });
});

describe('validarFaixasManuais', () => {
    const fc = () => linhasDasZonas(ZONAS.zonas, 'fc');
    const pace = () => linhasDasZonas(ZONAS.zonas, 'pace');

    it('faixas calculadas são válidas (borda compartilhada aceita)', () => {
        expect(validarFaixasManuais(fc(), 'fc')).toEqual({});
        expect(validarFaixasManuais(pace(), 'pace')).toEqual({});
    });

    it('lacuna é aceita', () => {
        const l = fc();
        l[2] = { de: '153', ate: '158' };

        expect(validarFaixasManuais(l, 'fc')).toEqual({});
    });

    it('FC: De igual a Até aponta a linha', () => {
        const l = fc();
        l[1] = { de: '145', ate: '145' };

        expect(validarFaixasManuais(l, 'fc')[1]).toMatch(/menor que/);
    });

    it('FC sobreposta aponta a zona de cima', () => {
        const l = fc();
        l[1] = { de: '143', ate: '152' };

        expect(validarFaixasManuais(l, 'fc')).toEqual({ 2: 'Z3 começa dentro da Z2' });
    });

    it('pace com De mais lento que Até aponta a linha', () => {
        const l = pace();
        l[2] = { de: '5:15', ate: '5:00' };

        expect(validarFaixasManuais(l, 'pace')[2]).toMatch(/mais rápido/);
    });

    it('pace sobreposto aponta a zona de cima', () => {
        const l = pace();
        l[2] = { de: '5:00', ate: '5:20' };

        expect(validarFaixasManuais(l, 'pace')[2]).toBe('Z3 sobrepõe a Z2');
    });

    it('formato inválido e fora dos limites', () => {
        const l = fc();
        l[0] = { de: 'abc', ate: '143' };
        l[4] = { de: '168', ate: '240' };
        const erros = validarFaixasManuais(l, 'fc');

        expect(erros[0]).toMatch(/inválido/);
        expect(erros[4]).toMatch(/40 e 230/);
    });

    it('pace fora de 2:00–15:00', () => {
        const l = pace();
        l[0] = { de: '5:45', ate: '15:01' };

        expect(validarFaixasManuais(l, 'pace')[0]).toMatch(/2:00 e 15:00/);
    });
});

describe('corpoManual', () => {
    it('converte as linhas em faixas numeradas na ordem', () => {
        expect(corpoManual(linhasDasZonas(ZONAS.zonas, 'pace'), 'pace')[1]).toEqual({ zona: 2, min: 315, max: 345 });
        expect(corpoManual(linhasDasZonas(ZONAS.zonas, 'fc'), 'fc')[4]).toEqual({ zona: 5, min: 168, max: 178 });
    });
});

describe('previaManual', () => {
    it('FC: barra proporcional à largura de cada faixa e referência em % do LTHR', () => {
        const linhasFc = [
            { de: '120', ate: '140' }, { de: '140', ate: '150' }, { de: '153', ate: '160' },
            { de: '160', ate: '168' }, { de: '168', ate: '178' },
        ];
        const { barra, referencias } = previaManual(linhasFc, 'fc', 168);

        expect(barra).toEqual([
            { numero: 1, peso: 20 }, { numero: 2, peso: 10 }, { numero: 3, peso: 7 },
            { numero: 4, peso: 8 }, { numero: 5, peso: 10 },
        ]);
        expect(referencias[1]).toBe('83–89% LTHR');
    });

    it('pace: largura em s/km e referência em % do limiar', () => {
        const linhasPace = [
            { de: '5:45', ate: '6:15' }, { de: '5:15', ate: '5:45' }, { de: '5:00', ate: '5:15' },
            { de: '4:45', ate: '5:00' }, { de: '4:30', ate: '4:45' }, { de: '4:06', ate: '4:30' },
        ];
        const { barra, referencias } = previaManual(linhasPace, 'pace', 300);

        expect(barra[0]).toEqual({ numero: 1, peso: 30 });
        expect(barra).toHaveLength(6);
        expect(referencias[2]).toBe('100–105% limiar');
    });

    it('linha incompleta ou invertida ocupa peso 1; sem limiar a referência é "—"', () => {
        const { barra, referencias } = previaManual([{ de: '150', ate: '' }, { de: '160', ate: '150' }], 'fc', null);

        expect(barra).toEqual([{ numero: 1, peso: 1 }, { numero: 2, peso: 1 }]);
        expect(referencias).toEqual(['—', '—']);
    });
});
