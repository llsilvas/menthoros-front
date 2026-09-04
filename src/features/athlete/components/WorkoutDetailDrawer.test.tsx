import { render, screen } from '@testing-library/react';
import { createHashRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkoutDetailDrawer } from './WorkoutDetailDrawer';
import { useAthleteWorkoutAnalysis } from '../hooks/useAthleteWorkoutAnalysis';
import { workoutTypeColor } from '../../../theme/activeTheme';
import type { AgendaDay } from '../adapters/buildWeekAgenda';
import type { AthleteWorkoutAnalysis } from '../../../types/AthleteWorkoutAnalysis';

vi.mock('../hooks/useAthleteWorkoutAnalysis', () => ({
    useAthleteWorkoutAnalysis: vi.fn(),
}));

const useAnalysis = vi.mocked(useAthleteWorkoutAnalysis);

const completa: AthleteWorkoutAnalysis = {
    status: 'COMPLETED',
    reconhecimento: 'Você segurou o ritmo nos dois blocos.',
    comoFoi: 'Saiu como planejado.',
    esforco: 'Pesou um pouco mais que o esperado.',
    proximoTreino: 'Capriche no sono hoje.',
    executado: { duracaoMin: 58, rpe: 7 },
};

function dia(over: Partial<AgendaDay> = {}): AgendaDay {
    return {
        date: new Date(2026, 7, 25),
        iso: '2026-08-25',
        isToday: false,
        status: 'concluido',
        workout: {
            title: 'Tempo',
            description: 'Dois blocos de tempo.',
            color: workoutTypeColor('CONTINUO'),
            durationMin: 61,
            distanceEstimated: false,
            temEtapas: true,
            treinoRealizadoId: 'tr1',
            analiseDisponivel: true,
            treino: {
                tipoTreino: 'CONTINUO',
                dataTreino: '2026-08-25',
                diaSemana: 'TERCA',
                distanciaKm: 0,
                percepcaoEsforcoRealizado: 7,
                etapas: [{ tipoEtapa: 'AQUECIMENTO', duracaoMin: 15 }],
            },
        },
        ...over,
    };
}

function renderDrawer(d: AgendaDay) {
    const router = createHashRouter([
        { path: '/', element: <WorkoutDetailDrawer dia={d} onClose={vi.fn()} onRegister={vi.fn()} /> },
    ]);
    return render(<RouterProvider router={router} />);
}

describe('WorkoutDetailDrawer — análise do treino', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('concluído com análise pronta: chip com RPE e card com os blocos', () => {
        useAnalysis.mockReturnValue({ analysis: completa, status: 'done', error: null, loading: false });

        renderDrawer(dia());

        expect(useAnalysis).toHaveBeenCalledWith('tr1');
        expect(screen.getByText('Concluído')).toBeInTheDocument();
        expect(screen.getByText('RPE 7/10 · Difícil')).toBeInTheDocument();
        expect(screen.getByTestId('workout-analysis-card')).toBeInTheDocument();
        expect(screen.getByText('Saiu como planejado.')).toBeInTheDocument();
        expect(screen.getByText('Para o próximo treino')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /registrar treino/i })).toBeNull();
    });

    it('concluído sem análise (204): chip sem card — o drawer segue útil', () => {
        useAnalysis.mockReturnValue({ analysis: null, status: 'empty', error: null, loading: false });

        renderDrawer(dia());

        expect(screen.getByText('Concluído')).toBeInTheDocument();
        expect(screen.queryByTestId('workout-analysis-card')).toBeNull();
        expect(screen.getByText('Dois blocos de tempo.')).toBeInTheDocument();
    });

    it('dia de hoje pendente: sem chip, sem card, com "Registrar treino" — hook desligado', () => {
        useAnalysis.mockReturnValue({ analysis: null, status: 'idle', error: null, loading: false });

        renderDrawer(dia({ isToday: true, status: 'pendente' }));

        expect(useAnalysis).toHaveBeenCalledWith(null);
        expect(screen.queryByText('Concluído')).toBeNull();
        expect(screen.queryByTestId('workout-analysis-card')).toBeNull();
        expect(screen.getByRole('button', { name: /registrar treino/i })).toBeInTheDocument();
    });
});
