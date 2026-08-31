import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeekAgendaRow } from './WeekAgendaRow';
import { workoutTypeColor } from '../../../theme/activeTheme';
import type { AgendaDay } from '../adapters/buildWeekAgenda';

function diaConcluido(analiseDisponivel: boolean): AgendaDay {
    return {
        date: new Date(2026, 7, 25),
        iso: '2026-08-25',
        isToday: false,
        status: 'concluido',
        workout: {
            title: 'Tempo',
            description: '',
            color: workoutTypeColor('CONTINUO'),
            durationMin: 61,
            distanceEstimated: false,
            temEtapas: true,
            treinoRealizadoId: 'tr1',
            analiseDisponivel,
            treino: { tipoTreino: 'CONTINUO', dataTreino: '2026-08-25', diaSemana: 'TERCA', distanciaKm: 0 },
        },
    };
}

function renderRow(d: AgendaDay) {
    return render(
        <WeekAgendaRow dia={d} expanded={false} onToggle={vi.fn()} onOpenDetail={vi.fn()} onRegister={vi.fn()} />,
    );
}

describe('WeekAgendaRow — sinal de análise', () => {
    it('mostra "Análise pronta" quando a flag vem do plano', () => {
        renderRow(diaConcluido(true));
        expect(screen.getByText('Análise pronta')).toBeInTheDocument();
    });

    it('sem a flag, a linha fica como era', () => {
        renderRow(diaConcluido(false));
        expect(screen.queryByText('Análise pronta')).toBeNull();
    });
});
