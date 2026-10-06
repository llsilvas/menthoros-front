import { describe, expect, it } from 'vitest';
import { buildWorkoutAnalysisView } from './buildWorkoutAnalysisView';
import { effortColor } from '../../../shared/theme/workoutColors';
import type { AthleteWorkoutAnalysis } from '../../../types/AthleteWorkoutAnalysis';

const completa: AthleteWorkoutAnalysis = {
    status: 'COMPLETED',
    analyzedAt: '2026-08-30T12:00:00Z',
    reconhecimento: 'Você segurou o ritmo nos dois blocos.',
    comoFoi: 'Saiu como planejado.',
    esforco: 'Pesou um pouco mais que o esperado.',
    proximoTreino: 'Capriche no sono hoje.',
    executado: { duracaoMin: 58, distanciaKm: 11.2, rpe: 7 },
    planejado: { duracaoMin: 61, distanciaKm: 11, rpeEsperado: 6 },
};

describe('buildWorkoutAnalysisView', () => {
    it('done: quatro textos e chip do RPE', () => {
        const view = buildWorkoutAnalysisView(completa);

        expect(view.status).toBe('done');
        expect(view.comoFoi).toBe('Saiu como planejado.');
        expect(view.rpeChipLabel).toBe('RPE 7/10 · Difícil');
    });

    it('metrics: três itens formatados com unidade, na ordem duração/distância/RPE', () => {
        const view = buildWorkoutAnalysisView(completa);

        expect(view.metrics.map((m) => m.text)).toEqual(['58 min', '11,2 km', 'RPE 7/10']);
    });

    it('plan line: aparece quando algum número difere do plano', () => {
        const view = buildWorkoutAnalysisView(completa);

        expect(view.planLine).toBe('plano 61 min · 11,0 km · RPE esperado 6/10');
    });

    it('plan line: ausente quando todos os números batem com o plano', () => {
        const view = buildWorkoutAnalysisView({
            ...completa,
            executado: { duracaoMin: 61, distanciaKm: 11, rpe: 6 },
        });

        expect(view.planLine).toBeUndefined();
    });

    it('plan line: ausente quando não há planejado', () => {
        const view = buildWorkoutAnalysisView({ ...completa, planejado: undefined });

        expect(view.planLine).toBeUndefined();
    });

    it('rpe color: alerta (effortColor) quando RPE informado > esperado', () => {
        const view = buildWorkoutAnalysisView(completa); // rpe 7 > esperado 6

        const rpeItem = view.metrics.find((m) => m.key === 'rpe');
        expect(rpeItem?.color).toBe(effortColor(7));
    });

    it('rpe color: sem alerta quando RPE informado == esperado', () => {
        const view = buildWorkoutAnalysisView({
            ...completa,
            executado: { ...completa.executado, rpe: 6 },
        });

        const rpeItem = view.metrics.find((m) => m.key === 'rpe');
        expect(rpeItem?.color).toBeUndefined();
    });

    it('rpe color: sem alerta quando RPE informado < esperado', () => {
        const view = buildWorkoutAnalysisView({
            ...completa,
            executado: { ...completa.executado, rpe: 4 },
        });

        const rpeItem = view.metrics.find((m) => m.key === 'rpe');
        expect(rpeItem?.color).toBeUndefined();
    });

    it('rpe color: sem alerta quando não há esperado para comparar', () => {
        const view = buildWorkoutAnalysisView({ ...completa, planejado: undefined });

        const rpeItem = view.metrics.find((m) => m.key === 'rpe');
        expect(rpeItem?.color).toBeUndefined();
    });

    it('pending: sem textos, com os números do executado', () => {
        const view = buildWorkoutAnalysisView({
            status: 'PENDING',
            executado: { duracaoMin: 58, distanciaKm: 11.2, rpe: 7 },
        });

        expect(view.status).toBe('pending');
        expect(view.comoFoi).toBeUndefined();
        expect(view.metrics.map((m) => m.text)).toEqual(['58 min', '11,2 km', 'RPE 7/10']);
    });

    it('sem RPE: sem chip e sem item de RPE nas métricas', () => {
        const view = buildWorkoutAnalysisView({
            status: 'PENDING',
            executado: { duracaoMin: 40 },
        });

        expect(view.rpeChipLabel).toBeUndefined();
        expect(view.metrics.map((m) => m.key)).toEqual(['duracao']);
    });
});
