import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WeekClosedBanner } from './WeekClosedBanner';

describe('WeekClosedBanner', () => {
    it('exibe a contagem de treinos perdidos (plural)', () => {
        render(<WeekClosedBanner treinosPerdidos={3} />);
        expect(screen.getByText(/Sua semana foi encerrada/)).toBeInTheDocument();
        expect(screen.getByText(/3 treinos ficaram para trás/)).toBeInTheDocument();
    });

    it('usa singular quando há apenas um treino perdido', () => {
        render(<WeekClosedBanner treinosPerdidos={1} />);
        expect(screen.getByText(/1 treino ficou para trás/)).toBeInTheDocument();
    });

    it('aciona onDismiss ao fechar', async () => {
        const onDismiss = vi.fn();
        render(<WeekClosedBanner treinosPerdidos={2} onDismiss={onDismiss} />);
        await userEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(onDismiss).toHaveBeenCalled();
    });
});
