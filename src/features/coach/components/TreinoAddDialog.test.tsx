import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreinoAddDialog } from './TreinoAddDialog';
import type { TreinoPlanejadoDto } from '../../../types/PlanoReview';
import * as useAddHook from '../../../hooks/useAddTreinoPlanejado';

vi.mock('../../../hooks/useAddTreinoPlanejado');

const SEMANA_INICIO = '2026-07-01';
const SEMANA_FIM    = '2026-07-07';
const PLANO_ID      = 'plano-1';

const TREINOS_EXISTENTES: TreinoPlanejadoDto[] = [
    { id: 't1', diaSemana: 'QUARTA', tipoTreino: 'FACIL', distanciaKm: 10, dataTreino: '2026-07-01' },
];

const mockAdicionarTreino = vi.fn();

function stubHook(isSaving = false) {
    vi.mocked(useAddHook.useAddTreinoPlanejado).mockReturnValue({
        isSaving,
        error: null,
        adicionarTreino: mockAdicionarTreino,
    });
}

function renderDialog(opts: {
    onClose?: () => void;
    onSaved?: (t: TreinoPlanejadoDto) => void;
    treinosExistentes?: TreinoPlanejadoDto[];
} = {}) {
    const onClose = opts.onClose ?? vi.fn();
    const onSaved = opts.onSaved ?? vi.fn();
    render(
        <TreinoAddDialog
            open
            planoId={PLANO_ID}
            semanaInicio={SEMANA_INICIO}
            semanaFim={SEMANA_FIM}
            treinosExistentes={opts.treinosExistentes ?? TREINOS_EXISTENTES}
            onClose={onClose}
            onSaved={onSaved}
        />,
    );
    return { onClose, onSaved };
}

describe('TreinoAddDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        stubHook();
    });

    it('renderiza campos obrigatórios: tipo e data', () => {
        renderDialog();
        expect(screen.getByLabelText(/tipo de treino/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/data do treino/i)).toBeInTheDocument();
    });

    it('botão salvar desabilitado sem tipo e data preenchidos', () => {
        renderDialog();
        expect(screen.getByRole('button', { name: /salvar treino/i })).toBeDisabled();
    });

    it('seção etapas colapsada por default', () => {
        renderDialog();
        expect(screen.queryByRole('button', { name: /remover etapa/i })).not.toBeInTheDocument();
    });

    it('botão adicionar etapas expande a seção e adiciona linha', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /adicionar etapas/i }));
        // Após expandir, o toggle muda para "Ocultar etapas" e aparece o botão "Adicionar etapa"
        fireEvent.click(screen.getByRole('button', { name: /^adicionar etapa$/i }));
        expect(screen.getByRole('button', { name: /remover etapa/i })).toBeInTheDocument();
    });

    it('remove etapa ao clicar no botão remover', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /adicionar etapas/i }));
        fireEvent.click(screen.getByRole('button', { name: /^adicionar etapa$/i }));
        expect(screen.getByRole('button', { name: /remover etapa/i })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /remover etapa/i }));

        expect(screen.queryByRole('button', { name: /remover etapa/i })).not.toBeInTheDocument();
    });

    it('exibe aviso de double-day quando data selecionada já tem treino', () => {
        renderDialog();
        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-01' } });
        expect(screen.getByText(/já existe.*treino.*nesta data/i)).toBeInTheDocument();
    });

    it('chama onSaved após sucesso e fecha dialog', async () => {
        const novoTreino: TreinoPlanejadoDto = {
            id: 'novo-treino', diaSemana: 'SEXTA', tipoTreino: 'CONTINUO',
            distanciaKm: 0, adicionadoPeloCoach: true,
        };
        mockAdicionarTreino.mockResolvedValue(novoTreino);
        const { onSaved } = renderDialog({ treinosExistentes: [] });

        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-03' } });
        fireEvent.click(screen.getByRole('button', { name: /salvar treino/i }));

        await waitFor(() => {
            expect(onSaved).toHaveBeenCalledWith(novoTreino);
        });
    });
});
