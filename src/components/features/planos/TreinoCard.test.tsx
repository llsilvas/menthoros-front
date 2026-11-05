import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TreinoCard from './TreinoCard';
import { AnaliseService } from '../../../api/services/AnaliseService';
import { TreinoService } from '../../../api/services/TreinoService';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';

vi.mock('../../../api/services/AnaliseService', () => ({
    AnaliseService: { getAnaliseTreino: vi.fn() },
}));
vi.mock('../../../api/services/TreinoService', () => ({
    TreinoService: { atualizarTreino: vi.fn(), obterRealizado: vi.fn() },
}));

const getAnalise = vi.mocked(AnaliseService.getAnaliseTreino);

function treinoRealizado(): TreinoPlanejado {
    return {
        id: 'tp1',
        tipoTreino: 'CONTINUO',
        dataTreino: '2026-08-25',
        diaSemana: 'TERCA',
        distanciaKm: 10,
        statusTreino: 'REALIZADO',
        treinoRealizadoId: 'tr1',
        percepcaoEsforcoRealizado: 7,
    } as TreinoPlanejado;
}

function analise(over: Partial<AnaliseWorkout> = {}): AnaliseWorkout {
    return {
        id: 'a1',
        treinoRealizadoId: 'tr1',
        status: 'COMPLETED',
        summary: 'Execução dentro do esperado',
        recommendation: 'Manter a carga atual',
        executionScore: 8,
        atletaReconhecimento: 'Você segurou o ritmo.',
        atletaComoFoi: 'Saiu como planejado.',
        atletaEsforco: 'Pesou um pouco mais que o esperado.',
        atletaProximoTreino: 'Capriche no sono hoje.',
        ...over,
    };
}

function renderCard() {
    return render(
        <TreinoCard treino={treinoRealizado()} onDetalhes={vi.fn()} onMarcarRealizado={vi.fn()} />,
    );
}

describe('TreinoCard — insight', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('mostra causa, nota rotulada e resumo no card, sem expansão inline', async () => {
        getAnalise.mockResolvedValue(analise({ primaryCause: 'NORMAL' }));
        renderCard();

        expect(await screen.findByText('Execução dentro do esperado')).toBeInTheDocument();
        expect(screen.getByText('Execução Normal')).toBeInTheDocument();
        expect(screen.getByText('8/10')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /ver mais/i })).toBeNull();
        expect(screen.queryByText('Manter a carga atual')).toBeNull();
        expect(screen.queryByText('O que o atleta leu')).toBeNull();
    });

    it('sem ritmo alvo, a linha continua no card com "—" (mantém a altura alinhada na linha do grid)', async () => {
        getAnalise.mockResolvedValue(analise());
        renderCard();

        await screen.findByText('Execução dentro do esperado');
        expect(screen.getByText('Ritmo alvo')).toBeInTheDocument();
        expect(screen.getByText('Ritmo alvo').parentElement).toHaveTextContent('—');
    });

    it('"Ver insight completo" abre o dialog com a recomendação e o bloco do atleta recolhido', async () => {
        getAnalise.mockResolvedValue(analise());
        const user = userEvent.setup();
        renderCard();

        await screen.findByText('Execução dentro do esperado');
        await user.click(screen.getByRole('button', { name: /ver insight completo/i }));

        expect(screen.getByText('Manter a carga atual')).toBeInTheDocument();
        expect(screen.queryByText('Saiu como planejado.')).toBeNull();

        await user.click(screen.getByRole('button', { name: /o que o atleta leu/i }));

        expect(screen.getByText('Saiu como planejado.')).toBeInTheDocument();
        expect(screen.getByText('Capriche no sono hoje.')).toBeInTheDocument();
    });

    it('análise antiga (sem bloco do atleta) não renderiza a seção no dialog', async () => {
        getAnalise.mockResolvedValue(analise({
            atletaReconhecimento: undefined,
            atletaComoFoi: undefined,
            atletaEsforco: undefined,
            atletaProximoTreino: undefined,
        }));
        const user = userEvent.setup();
        renderCard();

        await screen.findByText('Execução dentro do esperado');
        await user.click(screen.getByRole('button', { name: /ver insight completo/i }));

        expect(screen.getByText('Manter a carga atual')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /o que o atleta leu/i })).toBeNull();
    });
});

describe('TreinoCard — Ver realizado', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(TreinoService.obterRealizado).mockResolvedValue({ id: 'tr1', distanciaKm: 10, percepcaoEsforco: 7 });
    });

    it('só aparece em treino realizado com vínculo', () => {
        getAnalise.mockResolvedValue(analise());
        const { rerender } = renderCard();
        expect(screen.getByRole('button', { name: 'Ver realizado' })).toBeInTheDocument();

        rerender(
            <TreinoCard treino={{ ...treinoRealizado(), treinoRealizadoId: undefined }} onDetalhes={vi.fn()} onMarcarRealizado={vi.fn()} />,
        );
        expect(screen.queryByRole('button', { name: 'Ver realizado' })).toBeNull();
    });

    it('aberto antes da resposta da análise: uma chamada só, e o banner aparece quando ela chega', async () => {
        let responder: (a: AnaliseWorkout) => void = () => {};
        getAnalise.mockReturnValue(new Promise<AnaliseWorkout>((r) => { responder = r; }) as never);
        renderCard();

        await userEvent.click(screen.getByRole('button', { name: 'Ver realizado' }));
        await screen.findByRole('columnheader', { name: 'Diferença' });
        expect(screen.queryByTestId('execucao-analise-banner')).toBeNull();

        responder(analise());

        expect(await screen.findByTestId('execucao-analise-banner')).toBeInTheDocument();
        expect(getAnalise).toHaveBeenCalledTimes(1);
    });

    it('depois de 204: o dialog mostra em andamento, sem nova chamada', async () => {
        getAnalise.mockResolvedValue(undefined as never);
        renderCard();
        await screen.findByText('Análise AI em andamento…');

        await userEvent.click(screen.getByRole('button', { name: 'Ver realizado' }));

        expect(await screen.findByText('Análise da IA em andamento')).toBeInTheDocument();
        expect(getAnalise).toHaveBeenCalledTimes(1);
    });

    it('depois de falha: dialog sem banner, sem nova chamada', async () => {
        getAnalise.mockRejectedValue(new Error('boom'));
        renderCard();
        await waitFor(() => expect(getAnalise).toHaveBeenCalledTimes(1));

        await userEvent.click(screen.getByRole('button', { name: 'Ver realizado' }));

        await screen.findByRole('columnheader', { name: 'Diferença' });
        expect(screen.queryByTestId('execucao-analise-banner')).toBeNull();
        expect(screen.queryByText(/Análise da IA/)).toBeNull();
        expect(getAnalise).toHaveBeenCalledTimes(1);
    });
});
