import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import InsightTreinoDialog from './InsightTreinoDialog';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';

function analise(over: Partial<AnaliseWorkout> = {}): AnaliseWorkout {
    return {
        id: 'a1',
        treinoRealizadoId: 'tr1',
        status: 'COMPLETED',
        summary: 'Corrida regenerativa bem executada',
        recommendation: 'Continue conforme planejado',
        primaryCause: 'PACING_ERROR',
        executionScore: 9,
        atletaComoFoi: 'Você manteve o ritmo.',
        ...over,
    };
}

const renderDialog = (a: AnaliseWorkout) =>
    render(<InsightTreinoDialog open onClose={vi.fn()} analise={a} titulo="Regenerativo · 6,1 km" dia="TER · 29/09" />);

describe('InsightTreinoDialog', () => {
    it('mostra veredito, resumo e recomendação; "O que o atleta leu" começa recolhido', () => {
        renderDialog(analise());

        expect(screen.getByText('Erro de Ritmo')).toBeInTheDocument();
        expect(screen.getByText('9/10')).toBeInTheDocument();
        expect(screen.getByText('Corrida regenerativa bem executada')).toBeInTheDocument();
        expect(screen.getByText('Continue conforme planejado')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /o que o atleta leu/i })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Você manteve o ritmo.')).toBeNull();
    });

    it('o botão expande e recolhe o texto do atleta', async () => {
        const user = userEvent.setup();
        renderDialog(analise());
        const botao = screen.getByRole('button', { name: /o que o atleta leu/i });

        await user.click(botao);
        expect(botao).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Você manteve o ritmo.')).toBeInTheDocument();

        await user.click(botao);
        expect(screen.queryByText('Você manteve o ritmo.')).toBeNull();
    });

    it('seções ausentes não renderizam bloco vazio', () => {
        renderDialog(analise({ recommendation: undefined, atletaComoFoi: undefined, primaryCause: undefined, executionScore: undefined }));

        expect(screen.queryByText('Recomendação')).toBeNull();
        expect(screen.queryByRole('button', { name: /o que o atleta leu/i })).toBeNull();
        expect(screen.queryByText(/\/10$/)).toBeNull();
        expect(screen.getByText('Corrida regenerativa bem executada')).toBeInTheDocument();
    });
});
