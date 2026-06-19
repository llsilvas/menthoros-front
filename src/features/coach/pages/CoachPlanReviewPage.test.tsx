import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CoachPlanReviewPage from './CoachPlanReviewPage';
import * as hookModule from '../../../hooks/useCoachPlanReview';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';

vi.mock('../../../hooks/useCoachPlanReview');

const STUB: PlanoSemanalDto = {
    id: 'plano-1',
    semanaInicio: '2026-06-23',
    semanaFim: '2026-06-29',
    volumePlanejadoKm: 45,
    volumeRealizadoKm: 0,
    volumeAlvoKm: 45,
    status: 'PLANEJADO',
    reviewStatus: 'AGUARDANDO_REVISAO',
    objetivoSemanal: 'Semana base aeróbica',
    treinosPlanejados: [
        { diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 10 },
        { diaSemana: 'QUARTA',  tipoTreino: 'TEMPO', distanciaKm: 12 },
    ],
};

function mockHook(overrides: Partial<ReturnType<typeof hookModule.useCoachPlanReview>> = {}) {
    vi.spyOn(hookModule, 'useCoachPlanReview').mockReturnValue({
        pendentes: [],
        isFetching: false,
        isActing: false,
        fetchError: null,
        fetchPendentes: vi.fn().mockResolvedValue(undefined),
        aprovar: vi.fn().mockResolvedValue(undefined),
        rejeitar: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    });
}

describe('CoachPlanReviewPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('exibe estado vazio quando não há planos pendentes', () => {
        mockHook({ pendentes: [] });
        render(<CoachPlanReviewPage />);
        expect(screen.getByText('Nenhum plano aguardando revisão')).toBeInTheDocument();
    });

    it('exibe spinner durante carregamento', () => {
        mockHook({ isFetching: true });
        render(<CoachPlanReviewPage />);
        expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it('exibe mensagem de erro quando fetchError está presente', () => {
        mockHook({ fetchError: new Error('Falha na rede') });
        render(<CoachPlanReviewPage />);
        expect(screen.getByText('Falha na rede')).toBeInTheDocument();
    });

    it('renderiza lista de planos pendentes', () => {
        mockHook({ pendentes: [STUB] });
        render(<CoachPlanReviewPage />);
        expect(screen.getByText('Semana base aeróbica')).toBeInTheDocument();
        expect(screen.getByText('1 plano pendente')).toBeInTheDocument();
    });

    it('selecionar plano exibe painel de detalhe com sessões', () => {
        mockHook({ pendentes: [STUB] });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /semana base aeróbica/i }));

        expect(screen.getByText(/45 km planejados/)).toBeInTheDocument();
        // "2 sessões" aparece no item da lista e no painel de detalhe
        expect(screen.getAllByText(/2 sessões/).length).toBeGreaterThanOrEqual(2);
    });

    it('clicar Aprovar chama aprovar com id correto', async () => {
        const aprovar = vi.fn().mockResolvedValue(undefined);
        mockHook({ pendentes: [STUB], aprovar });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /semana base aeróbica/i }));
        fireEvent.click(screen.getByRole('button', { name: /aprovar/i }));

        await waitFor(() => expect(aprovar).toHaveBeenCalledWith('plano-1'));
    });

    it('clicar Rejeitar abre modal de motivo', () => {
        mockHook({ pendentes: [STUB] });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /semana base aeróbica/i }));
        fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }));

        expect(screen.getByText('Rejeitar plano')).toBeInTheDocument();
        expect(screen.getByLabelText(/motivo da rejeição/i)).toBeInTheDocument();
    });

    it('confirmar rejeição chama rejeitar com motivo', async () => {
        const rejeitar = vi.fn().mockResolvedValue(undefined);
        mockHook({ pendentes: [STUB], rejeitar });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /semana base aeróbica/i }));
        fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }));

        fireEvent.change(screen.getByLabelText(/motivo da rejeição/i), {
            target: { value: 'Volume excessivo' },
        });
        fireEvent.click(screen.getByRole('button', { name: /confirmar rejeição/i }));

        await waitFor(() =>
            expect(rejeitar).toHaveBeenCalledWith('plano-1', 'Volume excessivo'),
        );
    });
});
