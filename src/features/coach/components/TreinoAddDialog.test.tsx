import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreinoAddDialog } from './TreinoAddDialog';
import type { TreinoPlanejadoDto, TreinoPlanejadoAddPayload } from '../../../types/PlanoReview';
import * as useTreinoHook from '../../../hooks/useTreinoPlanejado';

vi.mock('../../../hooks/useTreinoPlanejado');

const SEMANA_INICIO = '2026-07-01';
const SEMANA_FIM    = '2026-07-07';
const PLANO_ID      = 'plano-1';

const TREINOS_EXISTENTES: TreinoPlanejadoDto[] = [
    { id: 't1', diaSemana: 'QUARTA', tipoTreino: 'FACIL', distanciaKm: 10, dataTreino: '2026-07-01' },
];

const mockAdicionarTreino = vi.fn();

function stubHook(isSaving = false) {
    vi.mocked(useTreinoHook.useTreinoPlanejado).mockReturnValue({
        isSaving,
        isDeleting: false,
        saveError: null,
        deleteError: null,
        adicionarTreino: mockAdicionarTreino,
        editarTreino: vi.fn(),
        excluirTreino: vi.fn(),
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

    it('sem etapas por padrão — sem botões de remoção nem gráfico', () => {
        renderDialog();
        expect(screen.queryByRole('button', { name: /remover etapa/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /remover série/i })).not.toBeInTheDocument();
        expect(screen.queryByTestId('workout-profile')).not.toBeInTheDocument();
    });

    // O editor de etapas é o MESMO do Editar treino: botões "Etapa" e "Série", cartões com tipo.
    it('adiciona uma etapa avulsa', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));
        expect(screen.getByRole('button', { name: /remover etapa 1/i })).toBeInTheDocument();
        expect(screen.getByLabelText('Tipo da etapa 1')).toBeInTheDocument();
    });

    it('remove etapa ao clicar no botão remover', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));
        fireEvent.click(screen.getByRole('button', { name: /remover etapa 1/i }));
        expect(screen.queryByRole('button', { name: /remover etapa 1/i })).not.toBeInTheDocument();
    });

    it('adiciona uma série com contador de repetições e duas etapas', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /^série$/i }));

        expect(screen.getByTestId('repeticoes-display-0')).toHaveTextContent('3×');
        expect(screen.getByLabelText('Tipo da etapa 1 da série 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Tipo da etapa 2 da série 1')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /etapa na série/i })).toBeInTheDocument();
    });

    it('adiciona etapa na série e remove etapa da série', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /^série$/i }));

        fireEvent.click(screen.getByRole('button', { name: /etapa na série/i }));
        expect(screen.getByLabelText('Tipo da etapa 3 da série 1')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /remover etapa 1 da série 1/i }));
        expect(screen.queryByLabelText('Tipo da etapa 3 da série 1')).not.toBeInTheDocument();
    });

    it('etapa sem tipo avisa que não será salva', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));
        expect(screen.getByTestId('etapa-sem-tipo')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Tipo da etapa 1'), { target: { value: 'AQUECIMENTO' } });
        expect(screen.queryByTestId('etapa-sem-tipo')).not.toBeInTheDocument();
    });

    it('o gráfico do treino aparece quando há etapa com tipo, e acompanha o que se monta', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));
        expect(screen.queryByTestId('workout-profile')).not.toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Tipo da etapa 1'), { target: { value: 'PRINCIPAL' } });
        fireEvent.change(screen.getByLabelText('Duração (min)'), { target: { value: '40' } });

        expect(screen.getByTestId('workout-profile')).toBeInTheDocument();
    });

    it('exibe aviso de double-day quando data selecionada já tem treino', () => {
        renderDialog();
        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-01' } });
        expect(screen.getByText(/treino.*nesta data|nesta data.*double-day/i)).toBeInTheDocument();
    });

    it('serializa bloco corretamente no payload ao salvar', async () => {
        const novoTreino: TreinoPlanejadoDto = {
            id: 'novo', diaSemana: 'TERCA', tipoTreino: 'INTERVALADO', distanciaKm: 0,
        };
        mockAdicionarTreino.mockResolvedValue(novoTreino);
        renderDialog({ treinosExistentes: [] });

        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'INTERVALADO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-03' } });

        fireEvent.click(screen.getByRole('button', { name: /^série$/i }));

        // 3× por padrão → 4× com um clique; só a etapa com tipo é persistida (a segunda fica vazia).
        fireEvent.click(screen.getByLabelText(/aumentar repetições da série 1/i));
        fireEvent.change(screen.getByLabelText('Tipo da etapa 1 da série 1'), { target: { value: 'INTERVALADO' } });
        fireEvent.change(screen.getAllByLabelText('Duração (min)')[0], { target: { value: '3' } });

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

    it('exibe Alert de erro quando a API rejeita', async () => {
        mockAdicionarTreino.mockRejectedValue(new Error('Serviço indisponível'));
        renderDialog({ treinosExistentes: [] });

        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-03' } });
        fireEvent.click(screen.getByRole('button', { name: /salvar treino/i }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Serviço indisponível');
        });
    });

    it('isSaving=true desabilita botão Cancelar e impede nova submissão', () => {
        stubHook(true);
        renderDialog();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /salvar treino/i })).toBeDisabled();
    });

    it('totais computam multiplicando as etapas da série pelas repetições', () => {
        renderDialog();
        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'INTERVALADO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-03' } });
        fireEvent.click(screen.getByRole('button', { name: /^série$/i }));

        fireEvent.change(screen.getByLabelText('Tipo da etapa 1 da série 1'), { target: { value: 'INTERVALADO' } });
        fireEvent.change(screen.getAllByLabelText('Duração (min)')[0], { target: { value: '4' } });

        // 3 reps × 4 min = 12 min — o total aparece no rodapé
        expect(screen.getByTestId('totais-treino')).toHaveTextContent('12 min');
    });

    it('serializa etapa simples com duracaoMin como número no payload', async () => {
        const novoTreino: TreinoPlanejadoDto = {
            id: 'novo', diaSemana: 'QUINTA', tipoTreino: 'CONTINUO', distanciaKm: 0,
        };
        mockAdicionarTreino.mockResolvedValue(novoTreino);
        renderDialog({ treinosExistentes: [] });

        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-02' } });

        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));

        fireEvent.change(screen.getByLabelText('Tipo da etapa 1'), { target: { value: 'AQUECIMENTO' } });
        fireEvent.change(screen.getByLabelText('Duração (min)'), { target: { value: '15' } });

        fireEvent.click(screen.getByRole('button', { name: /salvar treino/i }));

        await waitFor(() => {
            const payload: TreinoPlanejadoAddPayload = mockAdicionarTreino.mock.calls[0][1];
            expect(payload.etapas).toHaveLength(1);
            expect(payload.etapas![0].tipoEtapa).toBe('AQUECIMENTO');
            expect(typeof payload.etapas![0].duracaoMin).toBe('number');
            expect(payload.etapas![0].duracaoMin).toBe(15);
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

    // ── improve-plan-edit-usability (Fase 3) ─────────────────────────────────

    it('diz o que falta para salvar em vez de só desabilitar o botão', () => {
        renderDialog();
        expect(screen.getByTestId('falta-para-salvar')).toHaveTextContent('Falta escolher o tipo de treino e o dia.');

        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        expect(screen.getByTestId('falta-para-salvar')).toHaveTextContent('Falta escolher o dia.');

        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-03' } });
        expect(screen.queryByTestId('falta-para-salvar')).not.toBeInTheDocument();
    });

    it('cabeçalho diz para quem é o treino', () => {
        render(
            <TreinoAddDialog open planoId={PLANO_ID} semanaInicio={SEMANA_INICIO} semanaFim={SEMANA_FIM}
                treinosExistentes={[]} contexto="Bruno Dias" onClose={vi.fn()} onSaved={vi.fn()} />,
        );
        expect(screen.getByText('Bruno Dias')).toBeInTheDocument();
    });

    it('zona e RPE do treino vão no payload mesmo com etapas (antes sumiam)', async () => {
        mockAdicionarTreino.mockResolvedValue({ id: 'n', diaSemana: 'TERCA', tipoTreino: 'CONTINUO', distanciaKm: 0 });
        renderDialog({ treinosExistentes: [] });

        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-03' } });
        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));
        fireEvent.change(screen.getByLabelText('Tipo da etapa 1'), { target: { value: 'PRINCIPAL' } });
        fireEvent.change(screen.getByLabelText('Duração (min)'), { target: { value: '40' } });
        fireEvent.change(screen.getByLabelText(/zona predominante/i), { target: { value: 'Z2' } });
        fireEvent.change(screen.getByLabelText(/esforço esperado/i), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: /salvar treino/i }));

        await waitFor(() => {
            const payload: TreinoPlanejadoAddPayload = mockAdicionarTreino.mock.calls[0][1];
            expect(payload.zonaAlvo).toBe('Z2');
            expect(payload.percepcaoEsforcoEsperada).toBe(5);
            expect(payload.duracaoMin).toBe(40);
            expect(payload.etapas).toHaveLength(1);
        });
    });

    it('com etapas, distância e duração do treino somem (vêm da soma); sem etapas, aparecem', () => {
        renderDialog();
        expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));
        fireEvent.change(screen.getByLabelText('Tipo da etapa 1'), { target: { value: 'PRINCIPAL' } });

        expect(screen.queryByPlaceholderText('0.0')).not.toBeInTheDocument();
    });

    it('ritmo e descrição ficam em "Mais detalhes": fechados numa etapa nova, abrem ao clicar', () => {
        renderDialog({ treinosExistentes: [] });

        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));
        expect(screen.queryByLabelText('Ritmo')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Descrição para o atleta')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /mais detalhes/i }));

        expect(screen.getByLabelText('Ritmo')).toBeInTheDocument();
        expect(screen.getByLabelText('Descrição para o atleta')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /mais detalhes/i })).not.toBeInTheDocument();
    });

    it('etapa ritmo e descrição vão no payload', async () => {
        mockAdicionarTreino.mockResolvedValue({ id: 'n', diaSemana: 'TERCA', tipoTreino: 'CONTINUO', distanciaKm: 0 });
        renderDialog({ treinosExistentes: [] });

        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        fireEvent.change(screen.getByLabelText(/data do treino/i), { target: { value: '2026-07-03' } });
        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));
        fireEvent.change(screen.getByLabelText('Tipo da etapa 1'), { target: { value: 'PRINCIPAL' } });
        fireEvent.click(screen.getByRole('button', { name: /mais detalhes/i }));
        fireEvent.change(screen.getByLabelText('Ritmo'), { target: { value: '5:30/km' } });
        fireEvent.change(screen.getByLabelText('Descrição para o atleta'), { target: { value: 'Leve, conversando' } });
        fireEvent.click(screen.getByRole('button', { name: /salvar treino/i }));

        await waitFor(() => {
            const payload: TreinoPlanejadoAddPayload = mockAdicionarTreino.mock.calls[0][1];
            expect(payload.etapas![0]).toMatchObject({ ritmoAlvo: '5:30/km', descricaoEtapa: 'Leve, conversando' });
        });
    });

    it('fechar com alterações pede confirmação; sem alterações fecha direto', () => {
        const { onClose } = renderDialog();

        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        expect(onClose).toHaveBeenCalledOnce();

        fireEvent.change(screen.getByLabelText(/tipo de treino/i), { target: { value: 'CONTINUO' } });
        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        expect(onClose).toHaveBeenCalledOnce();
        expect(screen.getByRole('alert', { name: /descarte/i })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /continuar editando/i }));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        fireEvent.click(screen.getByRole('button', { name: /^descartar$/i }));
        expect(onClose).toHaveBeenCalledTimes(2);
        expect(mockAdicionarTreino).not.toHaveBeenCalled();
    });

    it('a data vinda do chip de descanso não conta como alteração do coach', () => {
        const onClose = vi.fn();
        render(
            <TreinoAddDialog open planoId={PLANO_ID} semanaInicio={SEMANA_INICIO} semanaFim={SEMANA_FIM}
                treinosExistentes={[]} dataInicial="2026-07-03" onClose={onClose} onSaved={vi.fn()} />,
        );

        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

        expect(onClose).toHaveBeenCalledOnce();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
