import { describe, expect, it } from 'vitest';
import { buildIntensityLineFromEtapa, buildIntensityLineFromTreino } from './buildIntensityLine';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import type { EtapaTreinoDto } from '../../../types/PlanoReview';

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [
        { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
        { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 } },
    ],
};

const etapa = (over: Partial<EtapaTreinoDto>): EtapaTreinoDto => ({ tipoEtapa: 'PRINCIPAL', ...over });

describe('buildIntensityLineFromEtapa', () => {
    it('Z2 com os dois eixos e FC em destaque: pace vem antes da FC, primário marcado', () => {
        const linha = buildIntensityLineFromEtapa(
            etapa({ fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'FC' }),
            ZONES,
        );

        expect(linha).toEqual({
            zona: 'Z2',
            pace: '5:15–5:45',
            fc: '143–150 bpm',
            primario: 'FC',
            paceIndisponivel: false,
        });
    });

    it('etapa legada sem alvoPrimario: FC vence quando há os dois, como na derivação do backend', () => {
        const linha = buildIntensityLineFromEtapa(
            etapa({ fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km' }),
            ZONES,
        );

        expect(linha?.primario).toBe('FC');
    });

    it('legado só com pace: pace é o primário', () => {
        expect(buildIntensityLineFromEtapa(etapa({ ritmoAlvo: '4:30-4:45/km' }), ZONES)?.primario).toBe('PACE');
    });

    it('valores que não casam zona nenhuma são personalizados: sem zona, valores preservados', () => {
        const linha = buildIntensityLineFromEtapa(etapa({ fcAlvoEtapa: '151-155 bpm', alvoPrimario: 'FC' }), ZONES);

        expect(linha?.zona).toBeNull();
        expect(linha?.fc).toBe('151–155 bpm');
    });

    it('texto legado não parseável aparece como está', () => {
        const linha = buildIntensityLineFromEtapa(etapa({ fcAlvoEtapa: 'trote leve' }), ZONES);

        expect(linha?.fc).toBe('trote leve');
        expect(linha?.zona).toBeNull();
    });

    it('sem zonas carregadas mostra os valores sem zona', () => {
        const linha = buildIntensityLineFromEtapa(etapa({ ritmoAlvo: '5:15-5:45/km' }), null);

        expect(linha?.zona).toBeNull();
        expect(linha?.pace).toBe('5:15–5:45');
        expect(linha?.paceIndisponivel).toBe(false);
    });

    it('atleta sem pace de limiar e etapa sem ritmo: pace indisponível', () => {
        const semPace: AthleteTrainingZonesDto = {
            ...ZONES,
            disponibilidade: { pace: false, fc: true, motivoPace: 'SEM_PACE_LIMIAR' },
        };

        const linha = buildIntensityLineFromEtapa(etapa({ fcAlvoEtapa: '143-150 bpm', alvoPrimario: 'FC' }), semPace);

        expect(linha?.paceIndisponivel).toBe(true);
        expect(linha?.pace).toBeUndefined();
    });

    it('atleta sem pace de limiar mas etapa com ritmo persistido: exibe o ritmo, sem indisponível', () => {
        const semPace: AthleteTrainingZonesDto = {
            ...ZONES,
            disponibilidade: { pace: false, fc: true, motivoPace: 'SEM_PACE_LIMIAR' },
        };

        const linha = buildIntensityLineFromEtapa(etapa({ ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'PACE' }), semPace);

        expect(linha?.pace).toBe('5:15–5:45');
        expect(linha?.paceIndisponivel).toBe(false);
    });

    it('etapa sem alvo algum devolve null', () => {
        expect(buildIntensityLineFromEtapa(etapa({}), ZONES)).toBeNull();
        expect(buildIntensityLineFromEtapa(etapa({ alvoPrimario: 'NENHUM', fcAlvoEtapa: '143-150 bpm' }), ZONES)?.primario).toBe('NENHUM');
    });
});

describe('buildIntensityLineFromTreino', () => {
    it('usa a primeira etapa de esforço, não o aquecimento', () => {
        const linha = buildIntensityLineFromTreino(
            [
                etapa({ tipoEtapa: 'AQUECIMENTO', fcAlvoEtapa: '126-143 bpm' }),
                etapa({ tipoEtapa: 'INTERVALADO', ritmoAlvo: '4:30-4:45/km', alvoPrimario: 'PACE' }),
            ],
            ZONES,
        );

        expect(linha?.zona).toBe('Z5');
        expect(linha?.primario).toBe('PACE');
    });

    it('sem etapas devolve null (o card cai no texto de zonaAlvo)', () => {
        expect(buildIntensityLineFromTreino(undefined, ZONES)).toBeNull();
        expect(buildIntensityLineFromTreino([], ZONES)).toBeNull();
    });
});
