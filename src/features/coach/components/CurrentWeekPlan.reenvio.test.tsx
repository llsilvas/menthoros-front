import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrentWeekPlan } from './CurrentWeekPlan';
import { useTreinoPlanejado } from '../../../hooks/useTreinoPlanejado';
import { useReenviarSincronizacao } from '../../../hooks/useReenviarSincronizacao';
import type { PlanoVigenteDto, TreinoPlanejadoResumoDto } from '../../../types/AtletaPerfilCoach';

vi.mock('../../../hooks/useTreinoPlanejado');
vi.mock('../../../hooks/useReenviarSincronizacao');

const mockReenviar = vi.fn();

function treino(id: string, extra: Partial<TreinoPlanejadoResumoDto>): TreinoPlanejadoResumoDto {
    return {
        id,
        diaSemana: 'SEGUNDA',
        tipoTreino: 'FACIL',
        distanciaKm: 8,
        statusExecucao: 'PENDENTE',
        statusSincronizacao: 'SINCRONIZADO',
        atletaConectadoIntervalsIcu: false,
        channelConnected: true,
        syncInProgress: false,
        ...extra,
    };
}

function plano(treinos: TreinoPlanejadoResumoDto[], reviewStatus = 'APROVADO'): PlanoVigenteDto {
    return { planoId: 'plano-1', semanaInicio: '2026-11-02', semanaFim: '2026-11-08', reviewStatus, treinos };
}

function stubReenvio(estado: { reenviando?: boolean; erro?: string | null } = {}) {
    vi.mocked(useReenviarSincronizacao).mockReturnValue({
        reenviando: estado.reenviando ?? false,
        erro: estado.erro ?? null,
        reenviar: mockReenviar,
    });
}

function renderPlano(p: PlanoVigenteDto, onTreinoEditado = vi.fn()) {
    render(
        <CurrentWeekPlan plano={p} onGerarPlano={vi.fn()} onRevisarPlano={vi.fn()} onTreinoEditado={onTreinoEditado} />,
    );
    return { onTreinoEditado };
}

const botao = () => screen.queryByRole('button', { name: /reenviar ao relógio/i });

describe('CurrentWeekPlan — reenvio ao relógio', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useTreinoPlanejado).mockReturnValue({
            isSaving: false, isDeleting: false, saveError: null, deleteError: null,
            editarTreino: vi.fn(), adicionarTreino: vi.fn(), excluirTreino: vi.fn(),
        });
        stubReenvio();
    });

    it('sem treino em erro, o botão não aparece (CA7)', () => {
        renderPlano(plano([treino('t1', {})]));

        expect(botao()).not.toBeInTheDocument();
    });

    it('com treino em erro, o botão aparece habilitado (CA7)', () => {
        renderPlano(plano([treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE' })]));

        expect(botao()).toBeEnabled();
    });

    it('plano aguardando revisão não mostra o botão', () => {
        renderPlano(plano([treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE' })], 'AGUARDANDO_REVISAO'));

        expect(botao()).not.toBeInTheDocument();
    });

    it('atleta sem canal: botão desabilitado com tooltip (CA10)', async () => {
        renderPlano(plano([treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE', channelConnected: false })]));

        expect(botao()).toBeDisabled();
        await userEvent.hover(botao()!.parentElement!);
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Atleta sem canal conectado');
    });

    it('envio em andamento: botão desabilitado com tooltip (CA11)', async () => {
        renderPlano(plano([
            treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE' }),
            treino('t2', { statusSincronizacao: 'SINCRONIZANDO', syncInProgress: true }),
        ]));

        expect(botao()).toBeDisabled();
        await userEvent.hover(botao()!.parentElement!);
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Envio em andamento');
    });

    it('SINCRONIZANDO preso (syncInProgress false) não desabilita', () => {
        renderPlano(plano([
            treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE' }),
            treino('t2', { statusSincronizacao: 'SINCRONIZANDO', syncInProgress: false }),
        ]));

        expect(botao()).toBeEnabled();
    });

    it('clicar reenvia, mostra a confirmação e recarrega o plano', async () => {
        mockReenviar.mockResolvedValue(2);
        const { onTreinoEditado } = renderPlano(plano([treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE' })]));

        await userEvent.click(botao()!);

        expect(mockReenviar).toHaveBeenCalledWith('plano-1');
        expect(await screen.findByText(/Reenvio solicitado/)).toBeInTheDocument();
        await waitFor(() => expect(onTreinoEditado).toHaveBeenCalled());
    });

    it('resent = 0: avisa que nada estava em erro e não recarrega', async () => {
        mockReenviar.mockResolvedValue(0);
        const { onTreinoEditado } = renderPlano(plano([treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE' })]));

        await userEvent.click(botao()!);

        expect(await screen.findByText(/Nenhum treino em erro/)).toBeInTheDocument();
        expect(onTreinoEditado).not.toHaveBeenCalled();
    });

    it('falha no reenvio não recarrega o plano', async () => {
        mockReenviar.mockResolvedValue(null);
        const { onTreinoEditado } = renderPlano(plano([treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE' })]));

        await userEvent.click(botao()!);

        expect(mockReenviar).toHaveBeenCalled();
        expect(onTreinoEditado).not.toHaveBeenCalled();
    });

    it('mostra a mensagem de erro do hook', () => {
        stubReenvio({ erro: 'Envio em andamento. Aguarde alguns minutos e tente de novo.' });
        renderPlano(plano([treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE' })]));

        expect(screen.getByText(/Aguarde alguns minutos/)).toBeInTheDocument();
    });

    it('durante a chamada o botão fica desabilitado', () => {
        stubReenvio({ reenviando: true });
        renderPlano(plano([treino('t1', { statusSincronizacao: 'ERRO_PERMANENTE' })]));

        expect(screen.getByRole('button', { name: /reenviando/i })).toBeDisabled();
    });

    it('atleta só-Garmin conectado não aparece como "Não conectado" no chip (CA8)', () => {
        renderPlano(plano([treino('t1', { statusSincronizacao: 'SINCRONIZADO', atletaConectadoIntervalsIcu: false, channelConnected: true })]));

        expect(screen.queryByText('Não conectado')).not.toBeInTheDocument();
        expect(screen.getByText('No relógio')).toBeInTheDocument();
    });
});
