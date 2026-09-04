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

    it('concluído sem etapas ainda abre o detalhe — a análise mora lá', () => {
        const d = diaConcluido(true);
        d.workout!.temEtapas = false;
        renderRow(d);
        expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('sem a flag, a linha fica como era', () => {
        renderRow(diaConcluido(false));
        expect(screen.queryByText('Análise pronta')).toBeNull();
    });
});

function diaProva(over: { distanceKm?: number; duracaoMinRaw?: string } = {}): AgendaDay {
    return {
        date: new Date(2026, 7, 25),
        iso: '2026-08-25',
        isToday: false,
        status: 'pendente',
        workout: {
            title: 'Prova',
            description: 'Meia Maratona de São Paulo',
            color: workoutTypeColor('PROVA'),
            distanceKm: over.distanceKm ?? 21.1,
            distanceEstimated: false,
            temEtapas: false,
            analiseDisponivel: false,
            provaId: 'prova-1',
            duracaoMinRaw: over.duracaoMinRaw,
            treino: { tipoTreino: 'PROVA', dataTreino: '2026-08-25', diaSemana: 'TERCA', distanciaKm: over.distanceKm ?? 21.1 },
        },
    };
}

describe('WeekAgendaRow — dia da prova', () => {
    it('título é o nome da prova, não o rótulo genérico do tipo', () => {
        renderRow(diaProva());
        expect(screen.getByText('Meia Maratona de São Paulo')).toBeInTheDocument();
        expect(screen.queryByText('Prova', { selector: 'p' })).toBeNull();
    });

    it('meta mostra distância, "Prova" e a meta de tempo quando há duração', () => {
        renderRow(diaProva({ duracaoMinRaw: '01:45:00' }));
        expect(screen.getByText('21,1 km · Prova · meta 01:45:00')).toBeInTheDocument();
    });

    it('sem duração, a meta omite o trecho "meta hh:mm:ss"', () => {
        renderRow(diaProva({ duracaoMinRaw: undefined }));
        expect(screen.getByText('21,1 km · Prova')).toBeInTheDocument();
    });

    it('marca a linha com data-prova para o destaque visual (borda/fundo lime)', () => {
        renderRow(diaProva());
        expect(screen.getByTestId('week-agenda-row')).toHaveAttribute('data-prova', 'true');
    });

    it('um treino comum não ganha o marcador data-prova', () => {
        renderRow(diaConcluido(false));
        expect(screen.getByTestId('week-agenda-row')).not.toHaveAttribute('data-prova');
    });
});
