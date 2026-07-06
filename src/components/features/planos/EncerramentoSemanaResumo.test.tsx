import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EncerramentoSemanaResumo } from './EncerramentoSemanaResumo';
import type { EncerramentoSemanaResult } from '../../../types/Encerramento';

const BASE: EncerramentoSemanaResult = {
    planoId: 'p1',
    novoStatus: 'CONCLUIDO',
    treinosFinalizados: 2,
    treinosPerdidos: ['t1', 't2'],
    prontoParaProximaSemana: true,
    origem: 'ON_DEMAND',
    aviso: null,
};

describe('EncerramentoSemanaResumo', () => {
    it('estado concluído (verde) exibe o CTA e dispara o callback ao clicar', async () => {
        const onGerar = vi.fn();
        render(<EncerramentoSemanaResumo resultado={BASE} onGerarProximaSemana={onGerar} />);

        expect(screen.getByTestId('encerramento-resumo-concluido')).toBeInTheDocument();
        expect(screen.getByText(/Semana encerrada/)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /Gerar plano da próxima semana/ }));
        expect(onGerar).toHaveBeenCalledOnce();
    });

    it('estado parcial (amarelo) exibe o aviso em destaque e não exibe CTA', () => {
        const resultado: EncerramentoSemanaResult = {
            ...BASE,
            prontoParaProximaSemana: false,
            aviso: 'Semana ainda não terminou; os treinos futuros permanecem pendentes.',
        };
        render(<EncerramentoSemanaResumo resultado={resultado} onGerarProximaSemana={vi.fn()} />);

        expect(screen.getByTestId('encerramento-resumo-parcial')).toBeInTheDocument();
        expect(screen.getByText(/Semana ainda não terminou/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Gerar plano/ })).not.toBeInTheDocument();
    });
});
