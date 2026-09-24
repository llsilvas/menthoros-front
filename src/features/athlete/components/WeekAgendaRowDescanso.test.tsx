import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeekAgendaRow } from './WeekAgendaRow';
import type { AgendaDay } from '../adapters/buildWeekAgenda';

/**
 * show-descanso-no-plano, CA4: descanso prescrito e dia vazio param de ser a mesma tela.
 * Antes desta change, **todo** dia sem treino dizia "Descanso" (`WeekAgendaRow.tsx:140`).
 *
 * O CA2c registra que o novo rótulo do dia vazio ("Sem treino") muda a tela de planos antigos —
 * é mudança deliberada, decidida pelo founder, não regressão.
 */
describe('WeekAgendaRow — descanso prescrito x dia vazio', () => {
    const dia = (over: Partial<AgendaDay> = {}): AgendaDay => ({
        date: new Date(2026, 8, 24),
        iso: '2026-09-24',
        isToday: false,
        status: 'descanso',
        workout: null,
        descansoPrescrito: false,
        ...over,
    });

    const props = {
        expanded: false,
        onToggle: vi.fn(),
        onOpenDetail: vi.fn(),
        onRegister: vi.fn(),
    };

    const FRASE = 'Este dia foi reservado para recuperação.';

    it('descanso prescrito: mostra "Descanso" e a frase de atleta', () => {
        render(<WeekAgendaRow dia={dia({ descansoPrescrito: true })} {...props} />);

        expect(screen.getByText('Descanso')).toBeInTheDocument();
        expect(screen.getByText(FRASE)).toBeInTheDocument();
    });

    it('CA2c: dia vazio mostra "Sem treino" e nenhuma frase de recuperação', () => {
        render(<WeekAgendaRow dia={dia()} {...props} />);

        expect(screen.getByText('Sem treino')).toBeInTheDocument();
        expect(screen.queryByText(FRASE)).toBeNull();
        expect(screen.queryByText('Descanso')).toBeNull();
    });

    it('o motivo técnico do backend nunca aparece para o atleta', () => {
        const { container } = render(<WeekAgendaRow dia={dia({ descansoPrescrito: true })} {...props} />);

        expect(container.textContent).not.toMatch(/TSB|limiar|Readiness/i);
    });
});
