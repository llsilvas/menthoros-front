import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeeklyReviewCard } from './WeeklyReviewCard';
import type { WeeklyReviewVM } from '../types/WeeklyAthleteReview';

const vm: WeeklyReviewVM = {
    periodo: '05/05 – 11/05',
    recomendacao: 'Manter',
    recomendacaoTipo: 'MAINTAIN',
    aderencia: 'Média',
    aderenciaNivel: 'MEDIA',
    percentual: 75,
    dadosSuficientes: true,
    delta: null,
    nextWeekFocus: null,
};

const props = { review: null, isLoading: false, error: null, naoDisponivel: false, onRetry: () => {} };

describe('WeeklyReviewCard', () => {
    it('loading → skeleton', () => {
        const { container } = render(<WeeklyReviewCard {...props} isLoading />);
        expect(container.querySelector('.MuiSkeleton-root')).toBeTruthy();
    });

    it('naoDisponivel → estado empty', () => {
        render(<WeeklyReviewCard {...props} naoDisponivel />);
        expect(screen.getByText(/Nenhuma semana fechada/i)).toBeTruthy();
    });

    it('error → alerta com "Tentar novamente" que refaz o fetch', async () => {
        const onRetry = vi.fn();
        const user = userEvent.setup();
        render(<WeeklyReviewCard {...props} error={new Error('x')} onRetry={onRetry} />);

        await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('dados → mostra recomendação/aderência e NÃO tem ação de alterar plano (read-only)', () => {
        render(<WeeklyReviewCard {...props} review={vm} />);

        expect(screen.getByText('Manter')).toBeTruthy();
        expect(screen.getByText(/Aderência: Média \(75%\)/)).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull(); // sem botão no estado de dados → read-only
    });
});
