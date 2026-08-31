import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TreinoCard from './TreinoCard';
import { AnaliseService } from '../../../api/services/AnaliseService';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';

vi.mock('../../../api/services/AnaliseService', () => ({
    AnaliseService: { getAnaliseTreino: vi.fn() },
}));
vi.mock('../../../api/services/TreinoService', () => ({
    TreinoService: { atualizarTreino: vi.fn() },
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

describe('TreinoCard — o que o atleta leu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('expandir o insight mostra o bloco do atleta em somente leitura', async () => {
        getAnalise.mockResolvedValue(analise());
        const user = userEvent.setup();
        renderCard();

        expect(await screen.findByText('Execução dentro do esperado')).toBeInTheDocument();
        expect(screen.queryByText('O que o atleta leu')).toBeNull();

        await user.click(screen.getByRole('button', { name: /ver mais/i }));

        expect(screen.getByText('O que o atleta leu')).toBeInTheDocument();
        expect(screen.getByText('Saiu como planejado.')).toBeInTheDocument();
        expect(screen.getByText('Capriche no sono hoje.')).toBeInTheDocument();
    });

    it('análise antiga (sem bloco do atleta) não renderiza a seção', async () => {
        getAnalise.mockResolvedValue(analise({
            atletaReconhecimento: undefined,
            atletaComoFoi: undefined,
            atletaEsforco: undefined,
            atletaProximoTreino: undefined,
        }));
        const user = userEvent.setup();
        renderCard();

        expect(await screen.findByText('Execução dentro do esperado')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /ver mais/i }));

        expect(screen.queryByText('O que o atleta leu')).toBeNull();
    });
});
