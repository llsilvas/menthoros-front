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
    it('done: quatro textos, chip do RPE e três stats com plano', () => {
        const view = buildWorkoutAnalysisView(completa);

        expect(view.status).toBe('done');
        expect(view.comoFoi).toBe('Saiu como planejado.');
        expect(view.rpeChipLabel).toBe('RPE 7/10 · Difícil');
        expect(view.stats).toHaveLength(3);
        expect(view.stats[0]).toMatchObject({ label: 'Duração', value: '58 min', sub: 'plano 61 min' });
        expect(view.stats[2]).toMatchObject({ label: 'Esforço', value: '7/10', sub: 'esperado 6/10' });
        expect(view.stats[2].valueColor).toBe(effortColor(7));
    });

    it('pending: sem textos, com os números do executado', () => {
        const view = buildWorkoutAnalysisView({
            status: 'PENDING',
            executado: { duracaoMin: 58, distanciaKm: 11.2, rpe: 7 },
        });

        expect(view.status).toBe('pending');
        expect(view.comoFoi).toBeUndefined();
        expect(view.stats).toHaveLength(3);
        expect(view.stats[0].sub).toBeUndefined();
    });

    it('sem planejado: stats sem a linha "plano …"', () => {
        const view = buildWorkoutAnalysisView({ ...completa, planejado: undefined });

        expect(view.stats.every((s) => s.sub === undefined)).toBe(true);
    });

    it('sem RPE: sem chip e sem stat de esforço', () => {
        const view = buildWorkoutAnalysisView({
            status: 'PENDING',
            executado: { duracaoMin: 40 },
        });

        expect(view.rpeChipLabel).toBeUndefined();
        expect(view.stats.map((s) => s.label)).toEqual(['Duração']);
    });
});
