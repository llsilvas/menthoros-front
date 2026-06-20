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
    atletaNome: 'Ana Silva',
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
        reviewActiveFilter: 'AGUARDANDO_REVISAO',
        reviewSetFilter: vi.fn(),
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

// Seleciona o card pelo nome do atleta (acessible name do role=button)
function clickCard() {
    fireEvent.click(screen.getByRole('button', { name: /ana silva/i }));
}

describe('CoachPlanReviewPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('exibe estado vazio quando não há planos no filtro ativo', () => {
        mockContext({ reviewPendentes: [], reviewActiveFilter: 'AGUARDANDO_REVISAO' });
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

    it('renderiza nome do atleta e contador na lista', () => {
        mockContext({ reviewPendentes: [STUB] });
        render(<CoachPlanReviewPage />);
        expect(screen.getByText('Ana Silva')).toBeInTheDocument();
        expect(screen.getByText('1 plano')).toBeInTheDocument();
    });

    it('selecionar plano exibe painel de detalhe com botões de ação', () => {
        mockContext({ reviewPendentes: [STUB] });
        render(<CoachPlanReviewPage />);

        clickCard();

        expect(screen.getAllByText(/45 km/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByRole('button', { name: /aprovar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /rejeitar/i })).toBeInTheDocument();
    });

    it('clicar Aprovar chama reviewAprovar com id correto', async () => {
        const reviewAprovar = vi.fn().mockResolvedValue(undefined);
        mockContext({ reviewPendentes: [STUB], reviewAprovar });
        render(<CoachPlanReviewPage />);

        clickCard();
        fireEvent.click(screen.getByRole('button', { name: /aprovar/i }));

        await waitFor(() => expect(reviewAprovar).toHaveBeenCalledWith('plano-1'));
    });

    it('clicar Rejeitar abre modal de motivo', () => {
        mockContext({ reviewPendentes: [STUB] });
        render(<CoachPlanReviewPage />);

        clickCard();
        fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }));

        expect(screen.getByText('Rejeitar plano')).toBeInTheDocument();
        expect(screen.getByLabelText(/motivo da rejeição/i)).toBeInTheDocument();
    });

    it('confirmar rejeição chama reviewRejeitar com motivo', async () => {
        const reviewRejeitar = vi.fn().mockResolvedValue(undefined);
        mockContext({ reviewPendentes: [STUB], reviewRejeitar });
        render(<CoachPlanReviewPage />);

        clickCard();
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
