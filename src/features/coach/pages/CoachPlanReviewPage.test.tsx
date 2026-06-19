import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as reactRouter from 'react-router';
import CoachPlanReviewPage from './CoachPlanReviewPage';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';

vi.mock('react-router', async () => {
    const actual = await vi.importActual<typeof import('react-router')>('react-router');
    return { ...actual, useOutletContext: vi.fn() };
});

const STUB: PlanoSemanalDto = {
    id: 'plano-1',
    semanaInicio: '2026-06-23',
    semanaFim: '2026-06-29',
    volumePlanejadoKm: 45,
    volumeRealizadoKm: 0,
    volumeAlvoKm: 45,
    status: 'PLANEJADO',
    reviewStatus: 'AGUARDANDO_REVISAO',
    objetivoSemanal: 'Semana base aerobica',
    treinosPlanejados: [
        { diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 10 },
        { diaSemana: 'QUARTA',  tipoTreino: 'TEMPO', distanciaKm: 12 },
    ],
};

function mockContext(overrides: Partial<CoachLayoutOutletContext> = {}) {
    vi.mocked(reactRouter.useOutletContext).mockReturnValue({
        queue: [],
        queueLoading: false,
        queueError: null,
        refetchQueue: vi.fn(),
        reviewPendentes: [],
        reviewIsFetching: false,
        reviewIsActing: false,
        reviewFetchError: null,
        reviewActionError: null,
        reviewFetchPendentes: vi.fn().mockResolvedValue(undefined),
        reviewAprovar: vi.fn().mockResolvedValue(undefined),
        reviewRejeitar: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    });
}

describe('CoachPlanReviewPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('exibe estado vazio quando não há planos pendentes', () => {
        mockContext({ reviewPendentes: [] });
        render(<CoachPlanReviewPage />);
        expect(screen.getByText('Nenhum plano aguardando revisão')).toBeInTheDocument();
    });

    it('exibe spinner durante carregamento', () => {
        mockContext({ reviewIsFetching: true });
        render(<CoachPlanReviewPage />);
        expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it('exibe mensagem de erro quando fetchError está presente', () => {
        mockContext({ reviewFetchError: new Error('Falha na rede') });
        render(<CoachPlanReviewPage />);
        expect(screen.getByText('Falha na rede')).toBeInTheDocument();
    });

    it('renderiza lista de planos pendentes', () => {
        mockContext({ reviewPendentes: [STUB] });
        render(<CoachPlanReviewPage />);
        expect(screen.getByText('Semana base aerobica')).toBeInTheDocument();
        expect(screen.getByText('1 plano pendente')).toBeInTheDocument();
    });

    it('selecionar plano exibe painel de detalhe com sessões', () => {
        mockContext({ reviewPendentes: [STUB] });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /semana base aerobica/i }));

        expect(screen.getByText(/45 km planejados/)).toBeInTheDocument();
        expect(screen.getAllByText(/2 sessões/).length).toBeGreaterThanOrEqual(2);
    });

    it('clicar Aprovar chama reviewAprovar com id correto', async () => {
        const reviewAprovar = vi.fn().mockResolvedValue(undefined);
        mockContext({ reviewPendentes: [STUB], reviewAprovar });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /semana base aerobica/i }));
        fireEvent.click(screen.getByRole('button', { name: /aprovar/i }));

        await waitFor(() => expect(reviewAprovar).toHaveBeenCalledWith('plano-1'));
    });

    it('clicar Rejeitar abre modal de motivo', () => {
        mockContext({ reviewPendentes: [STUB] });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /semana base aerobica/i }));
        fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }));

        expect(screen.getByText('Rejeitar plano')).toBeInTheDocument();
        expect(screen.getByLabelText(/motivo da rejeição/i)).toBeInTheDocument();
    });

    it('confirmar rejeição chama reviewRejeitar com motivo', async () => {
        const reviewRejeitar = vi.fn().mockResolvedValue(undefined);
        mockContext({ reviewPendentes: [STUB], reviewRejeitar });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /semana base aerobica/i }));
        fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }));

        fireEvent.change(screen.getByLabelText(/motivo da rejeição/i), {
            target: { value: 'Volume excessivo' },
        });
        fireEvent.click(screen.getByRole('button', { name: /confirmar rejeição/i }));

        await waitFor(() =>
            expect(reviewRejeitar).toHaveBeenCalledWith('plano-1', 'Volume excessivo'),
        );
    });
});
