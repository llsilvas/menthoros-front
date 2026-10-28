import { describe, expect, it } from 'vitest';
import { fromEtapaItens, fromEtapaTreinoDto } from './input';
import { selectWorkoutProfile } from './selectWorkoutProfile';
import { emptyStep } from '../../coach/components/etapas/etapaItem';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [
        { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
        { numero: 3, nome: 'Tempo', pace: { minSegKm: 300, maxSegKm: 315 }, fc: { min: 150, max: 158 } },
    ],
};

describe('adaptadores de entrada do perfil — zona do atleta', () => {
    it('etapa salva com FC que casa Z2 e descrição antiga "Z3" deriva Z2 quando há zonas do atleta', () => {
        const input = fromEtapaTreinoDto(
            { tipoEtapa: 'PRINCIPAL', duracaoMin: 35, fcAlvoEtapa: '143-150 bpm', descricaoEtapa: 'Corrida contínua Z3' },
            ZONES,
        );

        const [b] = selectWorkoutProfile([input], { sport: 'run' }).blocks;

        expect(b.zone).toBe('Z2');
        expect(b.confidence).toBe('prescribed');
    });

    it('sem zonas carregadas, o comportamento anterior (texto) é mantido', () => {
        const input = fromEtapaTreinoDto(
            { tipoEtapa: 'PRINCIPAL', duracaoMin: 35, fcAlvoEtapa: '143-150 bpm', descricaoEtapa: 'Corrida contínua Z3' },
            null,
        );

        expect(selectWorkoutProfile([input], { sport: 'run' }).blocks[0].zone).toBe('Z3');
    });

    it('o editor ao vivo leva a zona escolhida, o ritmo e a distância', () => {
        const passo = { ...emptyStep(), tipoEtapa: 'PRINCIPAL', distanciaKm: '8', ritmoAlvo: '5:15-5:45/km', zonaEtapa: 'Z2' as const };

        const [input] = fromEtapaItens([passo]);

        expect(input).toMatchObject({ zonaEtapa: 'Z2', distanciaKm: 8, ritmoAlvo: '5:15-5:45/km' });
    });
});
