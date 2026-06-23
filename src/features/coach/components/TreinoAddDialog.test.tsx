import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreinoAddDialog } from './TreinoAddDialog';
import type { TreinoPlanejadoDto, TreinoPlanejadoAddPayload } from '../../../types/PlanoReview';
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

    it('seção etapas colapsada por default — sem botões de remoção', () => {
        renderDialog();
        expect(screen.queryByRole('button', { name: /remover etapa/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /remover bloco/i })).not.toBeInTheDocument();
    });

    it('expande seção e adiciona etapa simples', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /adicionar etapas/i }));
        fireEvent.click(screen.getByRole('button', { name: /adicionar etapa simples/i }));
        expect(screen.getByRole('button', { name: /remover etapa 1/i })).toBeInTheDocument();
    });

    it('remove etapa simples ao clicar no botão remover', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /adicionar etapas/i }));
        fireEvent.click(screen.getByRole('button', { name: /adicionar etapa simples/i }));
        fireEvent.click(screen.getByRole('button', { name: /remover etapa 1/i }));
        expect(screen.queryByRole('button', { name: /remover etapa 1/i })).not.toBeInTheDocument();
    });

    it('adiciona bloco repetido com repetições e sub-etapas', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /adicionar etapas/i }));
        fireEvent.click(screen.getByRole('button', { name: /adicionar bloco repetido/i }));

        // Deve mostrar campo de repetições e select do primeiro passo
        expect(screen.getByLabelText(/repetições do bloco 1/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tipo do passo 1 do bloco 1/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /adicionar passo ao bloco 1/i })).toBeInTheDocument();
    });

    it('adiciona passo ao bloco e remove passo', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /adicionar etapas/i }));
        fireEvent.click(screen.getByRole('button', { name: /adicionar bloco repetido/i }));

        // Adiciona segundo passo
        fireEvent.click(screen.getByRole('button', { name: /adicionar passo ao bloco 1/i }));
        expect(screen.getByLabelText(/tipo do passo 2 do bloco 1/i)).toBeInTheDocument();
        // Botão de remover passo aparece quando há mais de um
        expect(screen.getByRole('button', { name: /remover passo 1 do bloco 1/i })).toBeInTheDocument();

        // Remove o primeiro passo
        fireEvent.click(screen.getByRole('button', { name: /remover passo 1 do bloco 1/i }));
        expect(screen.queryByLabelText(/tipo do passo 2 do bloco 1/i)).not.toBeInTheDocument();
    });

    it('exibe aviso de double-day quando data selecionada já tem treino', () => {
        renderDialog();
        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-01' } });
        expect(screen.getByText(/já existe.*treino.*nesta data/i)).toBeInTheDocument();
    });

    it('serializa bloco corretamente no payload ao salvar', async () => {
        const novoTreino: TreinoPlanejadoDto = {
            id: 'novo', diaSemana: 'TERCA', tipoTreino: 'INTERVALADO', distanciaKm: 0,
        };
        mockAdicionarTreino.mockResolvedValue(novoTreino);
        renderDialog({ treinosExistentes: [] });

        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'INTERVALADO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-03' } });

        fireEvent.click(screen.getByRole('button', { name: /adicionar etapas/i }));
        fireEvent.click(screen.getByRole('button', { name: /adicionar bloco repetido/i }));

        fireEvent.change(screen.getByLabelText(/repetições do bloco 1/i), { target: { value: '4' } });
        fireEvent.change(screen.getByLabelText(/tipo do passo 1 do bloco 1/i), { target: { value: 'INTERVALADO' } });
        fireEvent.change(screen.getByLabelText(/duração do passo 1 do bloco 1/i), { target: { value: '3' } });

        fireEvent.click(screen.getByRole('button', { name: /salvar treino/i }));

        await waitFor(() => {
            const call = mockAdicionarTreino.mock.calls[0];
            const payload: TreinoPlanejadoAddPayload = call[1];
            expect(payload.etapas).toHaveLength(1);
            expect(payload.etapas![0].tipoEtapa).toBe('BLOCO');
            expect(payload.etapas![0].blocoRepeticoes).toBe(4);
            expect(payload.etapas![0].subEtapas).toHaveLength(1);
            expect(payload.etapas![0].subEtapas![0].tipoEtapa).toBe('INTERVALADO');
            expect(payload.etapas![0].subEtapas![0].duracaoMin).toBe(3);
        });
    });

    it('chama onSaved após sucesso', async () => {
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
