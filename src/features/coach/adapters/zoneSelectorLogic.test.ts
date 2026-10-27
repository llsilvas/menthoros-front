import { describe, expect, it } from 'vitest';
import {
    aplicarZona,
    avisosDaEtapa,
    editarValor,
    escolherEixo,
    zonaDaEtapa,
    zonaPorValor,
    type IntensidadeEtapa,
} from './zoneSelectorLogic';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [
        { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 } },
        { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
        { numero: 3, nome: 'Tempo', pace: { minSegKm: 300, maxSegKm: 315 }, fc: { min: 150, max: 158 } },
        { numero: 4, nome: 'Limiar', pace: { minSegKm: 285, maxSegKm: 300 }, fc: { min: 158, max: 168 } },
        { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 } },
        { numero: 6, nome: 'Sprint', pace: { minSegKm: 246, maxSegKm: 270 }, motivoFc: 'FC_NAO_ESTABILIZA' },
    ],
};

const VAZIA: IntensidadeEtapa = { zona: null, fcAlvoEtapa: '', ritmoAlvo: '' };

const semPace: AthleteTrainingZonesDto = {
    ...ZONES,
    disponibilidade: { pace: false, fc: true, motivoPace: 'SEM_PACE_LIMIAR' },
    zonas: ZONES.zonas.map((z) => ({ ...z, pace: undefined })),
};

const fcEstimada: AthleteTrainingZonesDto = { ...ZONES, ancoras: { ...ZONES.ancoras, fcLimiarEstimada: true } };

describe('aplicarZona', () => {
    it('Z2 preenche pace e FC do atleta em formato canônico; PRINCIPAL pré-seleciona FC', () => {
        const r = aplicarZona(VAZIA, 'Z2', ZONES, 'PRINCIPAL', false);

        expect(r).toEqual({ zona: 'Z2', ritmoAlvo: '5:15-5:45/km', fcAlvoEtapa: '143-150 bpm', alvoPrimario: 'FC' });
    });

    it('Z5 preenche os valores de Z5 e pré-seleciona PACE', () => {
        const r = aplicarZona(VAZIA, 'Z5', ZONES, 'PRINCIPAL', false);

        expect(r).toMatchObject({ ritmoAlvo: '4:30-4:45/km', fcAlvoEtapa: '168-178 bpm', alvoPrimario: 'PACE' });
    });

    it('INTERVALADO pré-seleciona PACE mesmo em Z2', () => {
        expect(aplicarZona(VAZIA, 'Z2', ZONES, 'INTERVALADO', false).alvoPrimario).toBe('PACE');
    });

    it('eixo já tocado pelo treinador não volta ao default ao trocar a zona', () => {
        const comPace = { ...aplicarZona(VAZIA, 'Z2', ZONES, 'PRINCIPAL', false), alvoPrimario: 'PACE' as const };

        const r = aplicarZona(comPace, 'Z3', ZONES, 'PRINCIPAL', true);

        expect(r.alvoPrimario).toBe('PACE');
        expect(r.zona).toBe('Z3');
    });

    it('Z6 preenche só o pace e força PACE (não tem FC)', () => {
        const r = aplicarZona(VAZIA, 'Z6', ZONES, 'PRINCIPAL', false);

        expect(r).toEqual({ zona: 'Z6', ritmoAlvo: '4:06-4:30/km', fcAlvoEtapa: '', alvoPrimario: 'PACE' });
    });

    it('Z6 mesmo com eixo FC tocado cai para PACE: o eixo escolhido não tem valor', () => {
        const comFc = { ...VAZIA, alvoPrimario: 'FC' as const };

        expect(aplicarZona(comFc, 'Z6', ZONES, 'PRINCIPAL', true).alvoPrimario).toBe('PACE');
    });

    it('atleta sem pace de limiar: só a FC é preenchida e o eixo vai para FC', () => {
        const r = aplicarZona(VAZIA, 'Z5', semPace, 'INTERVALADO', false);

        expect(r).toEqual({ zona: 'Z5', ritmoAlvo: '', fcAlvoEtapa: '168-178 bpm', alvoPrimario: 'FC' });
    });

    it('Z6 sem pace de limiar: nada preenchido e eixo NENHUM', () => {
        const r = aplicarZona(VAZIA, 'Z6', semPace, 'INTERVALADO', false);

        expect(r).toEqual({ zona: 'Z6', ritmoAlvo: '', fcAlvoEtapa: '', alvoPrimario: 'NENHUM' });
    });

    it('FC de limiar estimada não é copiada: só o pace, eixo PACE', () => {
        const r = aplicarZona(VAZIA, 'Z2', fcEstimada, 'PRINCIPAL', false);

        expect(r).toEqual({ zona: 'Z2', ritmoAlvo: '5:15-5:45/km', fcAlvoEtapa: '', alvoPrimario: 'PACE' });
    });

    it('a faixa gravada é a base: nenhum ajuste de fadiga é somado', () => {
        const comFadiga = { ...ZONES, ajusteFadiga: { segundosPorKm: 12, tsbProntidao: -20 } };

        expect(aplicarZona(VAZIA, 'Z2', comFadiga, 'PRINCIPAL', false).ritmoAlvo).toBe('5:15-5:45/km');
    });
});

describe('editarValor', () => {
    const z2 = aplicarZona(VAZIA, 'Z2', ZONES, 'PRINCIPAL', false);

    it('editar à mão vira PERSONALIZADO sem apagar o outro campo', () => {
        const r = editarValor(z2, 'ritmoAlvo', '5:20-5:40/km', 'PRINCIPAL');

        expect(r).toMatchObject({ zona: 'PERSONALIZADO', ritmoAlvo: '5:20-5:40/km', fcAlvoEtapa: '143-150 bpm' });
    });

    it('limpar os dois valores deixa o eixo em NENHUM', () => {
        const semFc = editarValor(z2, 'fcAlvoEtapa', '', 'PRINCIPAL');
        const r = editarValor(semFc, 'ritmoAlvo', '', 'PRINCIPAL');

        expect(r.alvoPrimario).toBe('NENHUM');
    });

    it('limpar o eixo primário passa o eixo ao que sobrou', () => {
        const r = editarValor({ ...z2, alvoPrimario: 'FC' }, 'fcAlvoEtapa', '', 'PRINCIPAL');

        expect(r.alvoPrimario).toBe('PACE');
    });

    it('limpar o eixo que não é o primário mantém o primário', () => {
        const r = editarValor({ ...z2, alvoPrimario: 'FC' }, 'ritmoAlvo', '', 'PRINCIPAL');

        expect(r.alvoPrimario).toBe('FC');
    });

    it('primeiro valor digitado numa etapa vazia define o eixo por ele', () => {
        const r = editarValor(VAZIA, 'ritmoAlvo', '5:00-5:15/km', 'PRINCIPAL');

        expect(r).toMatchObject({ zona: 'PERSONALIZADO', alvoPrimario: 'PACE' });
    });
});

describe('escolherEixo', () => {
    it('troca o eixo sem mexer em zona nem valores', () => {
        const z2 = aplicarZona(VAZIA, 'Z2', ZONES, 'PRINCIPAL', false);

        expect(escolherEixo(z2, 'PACE')).toEqual({ ...z2, alvoPrimario: 'PACE' });
    });
});

describe('zonaDaEtapa (hidratação)', () => {
    it('valores que casam uma zona do atleta hidratam essa zona', () => {
        expect(zonaDaEtapa('143-150 bpm', '5:15-5:45/km', ZONES)).toBe('Z2');
    });

    it('valores que não casam viram PERSONALIZADO', () => {
        expect(zonaDaEtapa('151-155 bpm', undefined, ZONES)).toBe('PERSONALIZADO');
    });

    it('texto legado viram PERSONALIZADO, nunca descartado', () => {
        expect(zonaDaEtapa('trote leve', undefined, ZONES)).toBe('PERSONALIZADO');
    });

    it('sem nenhum alvo é null; sem zonas carregadas também', () => {
        expect(zonaDaEtapa('', '', ZONES)).toBeNull();
        expect(zonaDaEtapa('143-150 bpm', undefined, null)).toBeNull();
    });
});

describe('avisosDaEtapa', () => {
    const ids = (i: IntensidadeEtapa, zones: AthleteTrainingZonesDto | null = ZONES, tipoEtapa = 'PRINCIPAL', tipoTreino?: string) =>
        avisosDaEtapa(i, { zones, tipoEtapa, tipoTreino }).map((a) => a.id);

    it('texto legado não parseável avisa que não vira alvo no relógio', () => {
        expect(ids({ zona: 'PERSONALIZADO', fcAlvoEtapa: 'trote leve', ritmoAlvo: '' })).toContain('texto-legado');
    });

    it('zona ("Z2") e percentual (85-89%) são alvos que o backend entende: sem aviso de texto legado', () => {
        expect(ids({ zona: 'PERSONALIZADO', fcAlvoEtapa: 'Z2', ritmoAlvo: '' })).not.toContain('texto-legado');
        expect(ids({ zona: 'PERSONALIZADO', fcAlvoEtapa: 'z2-z3', ritmoAlvo: '' })).not.toContain('texto-legado');
        expect(ids({ zona: 'PERSONALIZADO', fcAlvoEtapa: '85-89%', ritmoAlvo: '' })).not.toContain('texto-legado');
    });

    it('pace em Z5 e FC em Z2 avisam a divergência, dizendo as duas zonas', () => {
        const aviso = avisosDaEtapa(
            { zona: 'PERSONALIZADO', fcAlvoEtapa: '145-152 bpm', ritmoAlvo: '4:30-4:45/km' },
            { zones: ZONES, tipoEtapa: 'PRINCIPAL' },
        ).find((a) => a.id === 'zonas-divergentes');

        expect(aviso?.texto).toContain('Pace é Z5 e FC é Z2');
    });

    it('valores digitados à mão que não casam a faixa inteira mas caem em zonas diferentes também avisam', () => {
        expect(ids({ zona: 'PERSONALIZADO', fcAlvoEtapa: '145-152 bpm', ritmoAlvo: '4:40-4:50/km' })).toContain('zonas-divergentes');
    });

    it('pace e FC da mesma zona não avisam divergência', () => {
        expect(ids({ zona: 'Z2', fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km' })).not.toContain('zonas-divergentes');
    });

    it('FC acima da máxima do atleta avisa que o push a descarta', () => {
        expect(ids({ zona: 'Z5', fcAlvoEtapa: '168-190 bpm', ritmoAlvo: '', alvoPrimario: 'FC' })).toContain('fc-acima-maxima');
        expect(ids({ zona: 'Z5', fcAlvoEtapa: '168-185 bpm', ritmoAlvo: '', alvoPrimario: 'FC' })).not.toContain('fc-acima-maxima');
    });

    it('Z5 168-178 com máxima 175 avisa; é o caso do contrato', () => {
        const max175 = { ...ZONES, fcMaxima: { bpm: 175, estimada: true } };

        expect(ids({ zona: 'Z5', fcAlvoEtapa: '168-178 bpm', ritmoAlvo: '', alvoPrimario: 'FC' }, max175)).toContain('fc-acima-maxima');
    });

    it('FC fora da faixa típica do tipo da etapa avisa', () => {
        // AQUECIMENTO espera Z1 (126-143); 168-178 não sobrepõe nada
        expect(ids({ zona: 'Z5', fcAlvoEtapa: '168-178 bpm', ritmoAlvo: '' }, ZONES, 'AQUECIMENTO')).toContain('fc-fora-da-faixa-tipica');
        expect(ids({ zona: 'Z1', fcAlvoEtapa: '126-143 bpm', ritmoAlvo: '' }, ZONES, 'AQUECIMENTO')).not.toContain('fc-fora-da-faixa-tipica');
    });

    it('atleta sem pace de limiar avisa, quando há zona escolhida', () => {
        expect(ids({ zona: 'Z2', fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '' }, semPace)).toContain('sem-pace-limiar');
    });

    it('FC de limiar estimada avisa que a FC não foi preenchida', () => {
        expect(ids({ zona: 'Z2', fcAlvoEtapa: '', ritmoAlvo: '5:15-5:45/km' }, fcEstimada)).toContain('fc-limiar-estimada');
    });

    it('etapa sem nada preenchido não gera aviso', () => {
        expect(ids(VAZIA)).toEqual([]);
    });
});

describe('zonaPorValor (zona do treino por onde os valores caem)', () => {
    it('faixa dentro de Z2, sem casar a faixa inteira, é Z2', () => {
        expect(zonaPorValor('144-148 bpm', '5:20-5:40/km', 'FC', ZONES)).toBe('Z2');
    });

    it('só FC ou só pace também classifica', () => {
        expect(zonaPorValor('170-176 bpm', undefined, undefined, ZONES)).toBe('Z5');
        expect(zonaPorValor(undefined, '4:35-4:45/km', undefined, ZONES)).toBe('Z5');
    });

    it('FC e pace em zonas diferentes: vale o eixo do relógio; sem eixo, sem zona', () => {
        expect(zonaPorValor('145-150 bpm', '4:30-4:45/km', 'FC', ZONES)).toBe('Z2');
        expect(zonaPorValor('145-150 bpm', '4:30-4:45/km', 'PACE', ZONES)).toBe('Z5');
        expect(zonaPorValor('145-150 bpm', '4:30-4:45/km', undefined, ZONES)).toBeNull();
    });

    it('texto livre, valor fora de qualquer zona ou sem zonas carregadas: null', () => {
        expect(zonaPorValor('trote leve', undefined, undefined, ZONES)).toBeNull();
        expect(zonaPorValor('190-200 bpm', undefined, undefined, ZONES)).toBeNull();
        expect(zonaPorValor('144-148 bpm', undefined, undefined, null)).toBeNull();
    });
});
