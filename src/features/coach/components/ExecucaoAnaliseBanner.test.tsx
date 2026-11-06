import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';
import { ExecucaoAnaliseBanner } from './ExecucaoAnaliseBanner';

const BASE: AnaliseWorkout = {
    id: 'a-1',
    treinoRealizadoId: 'tr-1',
    status: 'COMPLETED',
    summary: 'Saiu forte demais',
    recommendation: 'Segurar o início',
    primaryCause: 'PACING_ERROR',
    executionScore: 7,
};

const renderBanner = (data: AnaliseWorkout) =>
    render(<ExecucaoAnaliseBanner analise={{ status: 'pronta', data, refetch: vi.fn() }} />);

describe('ExecucaoAnaliseBanner', () => {
    it('mostra lado a lado a análise do treinador e o que foi enviado ao atleta', () => {
        renderBanner({
            ...BASE,
            atletaReconhecimento: 'Você segurou o ritmo.',
            atletaComoFoi: 'Saiu como planejado.',
            atletaEsforco: 'RPE 7 num treino previsto como 6.',
            atletaProximoTreino: 'Capriche no sono hoje.',
        });

        const treinador = screen.getByTestId('execucao-analise-treinador');
        expect(within(treinador).getByText('Para o treinador')).toBeInTheDocument();
        expect(within(treinador).getByText('Saiu forte demais')).toBeInTheDocument();

        const atleta = screen.getByTestId('execucao-analise-atleta');
        expect(within(atleta).getByText('Enviado ao atleta')).toBeInTheDocument();
        expect(within(atleta).getByText('Você segurou o ritmo.')).toBeInTheDocument();
        expect(within(atleta).getByText('Saiu como planejado.')).toBeInTheDocument();
        expect(within(atleta).getByText('RPE 7 num treino previsto como 6.')).toBeInTheDocument();
        expect(within(atleta).getByText('Capriche no sono hoje.')).toBeInTheDocument();
    });

    it('sem texto para o atleta (análise antiga ou bloqueada), avisa que nada foi enviado', () => {
        renderBanner(BASE);

        const atleta = screen.getByTestId('execucao-analise-atleta');
        expect(within(atleta).getByText('Nenhum retorno foi enviado ao atleta neste treino')).toBeInTheDocument();
    });
});
