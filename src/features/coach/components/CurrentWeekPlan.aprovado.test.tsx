import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrentWeekPlan } from './CurrentWeekPlan';
import { useTreinoPlanejado } from '../../../hooks/useTreinoPlanejado';
import { useReenviarSincronizacao } from '../../../hooks/useReenviarSincronizacao';
import { ApiError } from '../../../api/core/ApiError';
import type { PlanoVigenteDto, TreinoPlanejadoResumoDto } from '../../../types/AtletaPerfilCoach';
import type { WatchChannel } from '../adapters/watchChannel';

vi.mock('../../../hooks/useTreinoPlanejado');
vi.mock('../../../hooks/useReenviarSincronizacao');

const mockEditar = vi.fn();

function treino(id: string, diaSemana: string, extra: Partial<TreinoPlanejadoResumoDto> = {}): TreinoPlanejadoResumoDto {
    return {
        id,
        diaSemana,
        tipoTreino: 'CONTINUO',
        distanciaKm: 10,
        duracaoMin: 'PT60M',
        statusExecucao: 'PENDENTE',
        statusSincronizacao: 'SINCRONIZADO',
        channelConnected: true,
        editable: true,
        ...extra,
    };
}

function plano(treinos: TreinoPlanejadoResumoDto[], reviewStatus = 'APROVADO'): PlanoVigenteDto {
    return { planoId: 'plano-1', semanaInicio: '2026-11-02', semanaFim: '2026-11-08', reviewStatus, treinos };
}

function renderPlano(p: PlanoVigenteDto, canal: WatchChannel | null = 'GARMIN', onTreinoEditado = vi.fn()) {
    render(
        <CurrentWeekPlan plano={p} atletaNome="Mariana Costa" canal={canal}
            onGerarPlano={vi.fn()} onRevisarPlano={vi.fn()} onTreinoEditado={onTreinoEditado} />,
    );
    return { onTreinoEditado };
}

describe('CurrentWeekPlan — plano aprovado (coach-editar-treino-aprovado)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useTreinoPlanejado).mockReturnValue({
            isSaving: false, isDeleting: false, saveError: null, deleteError: null,
            editarTreino: mockEditar, adicionarTreino: vi.fn(), excluirTreino: vi.fn(),
        });
        vi.mocked(useReenviarSincronizacao).mockReturnValue({ reenviando: false, erro: null, reenviar: vi.fn() });
    });

    it('cabeçalho mostra o chip "Aprovado" e o texto de apoio', () => {
        renderPlano(plano([treino('t1', 'QUINTA')]));

        expect(screen.getByText('Aprovado')).toBeInTheDocument();
        expect(screen.getByText(/treinos pendentes podem ser editados/i)).toBeInTheDocument();
    });

    it('lápis só em treino editable; o cadeado traz o motivo do backend (CA10)', () => {
        renderPlano(plano([
            treino('t1', 'SEGUNDA', { statusExecucao: 'REALIZADO', editable: false, editRejection: 'NOT_PENDING' }),
            treino('t2', 'TERCA', { statusExecucao: 'PERDIDO', editable: false, editRejection: 'NOT_PENDING' }),
            treino('t3', 'QUARTA', { editable: false, editRejection: 'TODAY_ON_WATCH' }),
            treino('t0', 'TERCA', { editable: false, editRejection: 'PAST_DAY' }),
            treino('t4', 'QUINTA', { editable: true }),
        ]));

        expect(screen.getAllByRole('button', { name: /editar treino/i })).toHaveLength(1);
        expect(screen.getByRole('button', { name: /editar treino de qui/i })).toBeInTheDocument();
        expect(screen.getByLabelText('Treino realizado — não editável')).toBeInTheDocument();
        expect(screen.getByLabelText('Treino perdido — não editável')).toBeInTheDocument();
        expect(screen.getByLabelText('Treino de hoje já está no relógio')).toBeInTheDocument();
        expect(screen.getByLabelText('Treino de dia passado — não editável')).toBeInTheDocument();
    });

    it('backend anterior ao campo editable: plano aprovado não mostra lápis nem cadeado', () => {
        renderPlano(plano([treino('t1', 'QUINTA', { editable: undefined })]));

        expect(screen.queryByRole('button', { name: /editar treino/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('img', { name: /não editável|relógio/i })).not.toBeInTheDocument();
    });

    it('abre o dialog com o aviso do canal e "Salvar e reenviar" (CA11)', async () => {
        renderPlano(plano([treino('t1', 'QUINTA')]), 'GARMIN');

        await userEvent.click(screen.getByRole('button', { name: /editar treino de qui/i }));

        expect(screen.getByText(/já está no Garmin Connect de Mariana Costa/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar e reenviar' })).toBeInTheDocument();
    });

    it('sem canal: aviso "só no app"', async () => {
        renderPlano(plano([treino('t1', 'QUINTA', { channelConnected: false })]), null);

        await userEvent.click(screen.getByRole('button', { name: /editar treino de qui/i }));

        expect(screen.getByText(/a mudança aparece só no app/i)).toBeInTheDocument();
    });

    it('salvar com sucesso fecha o dialog, recarrega o perfil e avisa o reenvio', async () => {
        mockEditar.mockResolvedValue({});
        const { onTreinoEditado } = renderPlano(plano([treino('t1', 'QUINTA')]), 'GARMIN');

        await userEvent.click(screen.getByRole('button', { name: /editar treino de qui/i }));
        await userEvent.clear(screen.getByLabelText(/esforço esperado/i));
        await userEvent.type(screen.getByLabelText(/esforço esperado/i), '7');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        await waitFor(() => expect(onTreinoEditado).toHaveBeenCalled());
        expect(mockEditar).toHaveBeenCalledWith('plano-1', 't1', expect.objectContaining({ percepcaoEsforcoEsperada: 7 }));
        expect(screen.queryByRole('button', { name: 'Salvar e reenviar' })).not.toBeInTheDocument();
        expect(await screen.findByText(/atualizado\. reenviando ao Garmin Connect/i)).toBeInTheDocument();
    });

    it('409 do backend: o dialog continua aberto com a mensagem (D5)', async () => {
        mockEditar.mockRejectedValue(new ApiError(
            { method: 'PATCH', url: '/x' },
            { url: '/x', ok: false, status: 409, statusText: 'Conflict',
                body: { message: 'Envio ao relógio em andamento; tente em alguns segundos.' } },
            'Conflict',
        ));
        const { onTreinoEditado } = renderPlano(plano([treino('t1', 'QUINTA')]), 'GARMIN');

        await userEvent.click(screen.getByRole('button', { name: /editar treino de qui/i }));
        await userEvent.clear(screen.getByLabelText(/esforço esperado/i));
        await userEvent.type(screen.getByLabelText(/esforço esperado/i), '7');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Envio ao relógio em andamento');
        expect(screen.getByRole('button', { name: 'Salvar e reenviar' })).toBeInTheDocument();
        expect(onTreinoEditado).not.toHaveBeenCalled();
    });

    it('plano em revisão continua com lápis em todo treino e sem aviso de aprovado', async () => {
        renderPlano(plano([treino('t1', 'QUINTA', { editable: undefined })], 'AGUARDANDO_REVISAO'));

        await userEvent.click(screen.getByRole('button', { name: /editar treino de qui/i }));

        expect(screen.queryByText(/plano já aprovado/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    });
});
