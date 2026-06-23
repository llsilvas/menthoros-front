import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as reactRouter from 'react-router';
import CoachPlanReviewPage from './CoachPlanReviewPage';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';
import * as useEditHook from '../../../hooks/useEditTreinoPlanejado';
import * as useAddHook from '../../../hooks/useAddTreinoPlanejado';

vi.mock('react-router', async () => {
    const actual = await vi.importActual<typeof import('react-router')>('react-router');
    return { ...actual, useOutletContext: vi.fn() };
});

vi.mock('../../../hooks/useEditTreinoPlanejado');
vi.mock('../../../hooks/useAddTreinoPlanejado');

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
        { id: 'treino-1', diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 10 },
        { id: 'treino-2', diaSemana: 'QUARTA',  tipoTreino: 'TEMPO', distanciaKm: 12 },
    ],
};

const STUB_APROVADO: PlanoSemanalDto = {
    ...STUB,
    id: 'plano-2',
    reviewStatus: 'APROVADO',
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
        reviewAprovar: vi.fn().mockResolvedValue(true),
        reviewRejeitar: vi.fn().mockResolvedValue(true),
        ...overrides,
    });
}

// Seleciona o card pelo nome do atleta (acessible name do role=button)
function clickCard() {
    fireEvent.click(screen.getByRole('button', { name: /ana silva/i }));
}

const mockEditarTreino = vi.fn();
const mockAdicionarTreino = vi.fn();

function stubEditHook(isSaving = false) {
    vi.mocked(useEditHook.useEditTreinoPlanejado).mockReturnValue({
        isSaving,
        editarTreino: mockEditarTreino,
    });
}

function stubAddHook() {
    vi.mocked(useAddHook.useAddTreinoPlanejado).mockReturnValue({
        isSaving: false,
        error: null,
        adicionarTreino: mockAdicionarTreino,
    });
}

describe('CoachPlanReviewPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        stubEditHook();
        stubAddHook();
    });

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

    // ── Edição de treino ─────────────────────────────────────────────────────

    it('clicar editar → salvar chama editarTreino e reviewFetchPendentes', async () => {
        const reviewFetchPendentes = vi.fn().mockResolvedValue(undefined);
        mockEditarTreino.mockResolvedValue({ id: 'treino-1', diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 15, editadoPeloCoach: true });
        mockContext({ reviewPendentes: [STUB], reviewFetchPendentes });
        render(<CoachPlanReviewPage />);

        clickCard();

        // Abre o dialog clicando no primeiro botão de edição
        const editButtons = screen.getAllByRole('button', { name: /editar treino/i });
        fireEvent.click(editButtons[0]);

        // Dialog deve estar visível
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Muda distância para gerar um patch não vazio
        const distInput = screen.getByDisplayValue('10');
        fireEvent.change(distInput, { target: { value: '15' } });

        // Salva
        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        await waitFor(() => {
            expect(mockEditarTreino).toHaveBeenCalledWith('plano-1', 'treino-1', expect.objectContaining({ distanciaKm: 15 }));
            expect(reviewFetchPendentes).toHaveBeenCalled();
        });
    });

    it('botão editar presente quando plano AGUARDANDO_REVISAO e treino tem id', () => {
        mockContext({ reviewPendentes: [STUB] });
        render(<CoachPlanReviewPage />);

        clickCard();

        expect(screen.getAllByRole('button', { name: /editar treino/i }).length).toBeGreaterThanOrEqual(1);
    });

    it('botão editar ausente quando plano APROVADO', () => {
        mockContext({ reviewPendentes: [STUB_APROVADO] });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /ana silva/i }));

        expect(screen.queryByRole('button', { name: /editar treino/i })).not.toBeInTheDocument();
    });

    it('chip chip-editado-coach presente quando editadoPeloCoach=true', () => {
        const stubEditado: PlanoSemanalDto = {
            ...STUB,
            treinosPlanejados: [
                { id: 'treino-1', diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 10, editadoPeloCoach: true },
            ],
        };
        mockContext({ reviewPendentes: [stubEditado] });
        render(<CoachPlanReviewPage />);

        clickCard();

        expect(screen.getByTestId('chip-editado-coach')).toBeInTheDocument();
    });

    // ── Adição de treino ─────────────────────────────────────────────────────

    it('botão adicionar treino visível para plano AGUARDANDO_REVISAO', () => {
        mockContext({ reviewPendentes: [STUB] });
        render(<CoachPlanReviewPage />);

        clickCard();

        expect(screen.getByRole('button', { name: /adicionar treino/i })).toBeInTheDocument();
    });

    it('botão adicionar treino ausente para plano APROVADO', () => {
        mockContext({ reviewPendentes: [STUB_APROVADO] });
        render(<CoachPlanReviewPage />);

        fireEvent.click(screen.getByRole('button', { name: /ana silva/i }));

        expect(screen.queryByRole('button', { name: /adicionar treino/i })).not.toBeInTheDocument();
    });

    it('chip chip-adicionado-coach presente quando adicionadoPeloCoach=true', () => {
        const stubAdicionado: PlanoSemanalDto = {
            ...STUB,
            treinosPlanejados: [
                { id: 'treino-1', diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 10, adicionadoPeloCoach: true },
            ],
        };
        mockContext({ reviewPendentes: [stubAdicionado] });
        render(<CoachPlanReviewPage />);

        clickCard();

        expect(screen.getByTestId('chip-adicionado-coach')).toBeInTheDocument();
    });

    it('salvar no dialog de adição chama reviewFetchPendentes e exibe toast com tipoTreino', async () => {
        const reviewFetchPendentes = vi.fn().mockResolvedValue(undefined);
        const novoTreino = { id: 'novo', diaSemana: 'SEXTA', tipoTreino: 'LONGO', distanciaKm: 18 };
        mockAdicionarTreino.mockResolvedValue(novoTreino);
        mockContext({ reviewPendentes: [STUB], reviewFetchPendentes });
        render(<CoachPlanReviewPage />);

        clickCard();

        // Abre o dialog de adição
        fireEvent.click(screen.getByRole('button', { name: /adicionar treino/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Preenche campos obrigatórios e salva
        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'LONGO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-06-27' } });
        fireEvent.click(screen.getByRole('button', { name: /salvar treino/i }));

        await waitFor(() => {
            expect(reviewFetchPendentes).toHaveBeenCalled();
            expect(screen.getByText(/LONGO adicionado/i)).toBeInTheDocument();
        });
    });
});
