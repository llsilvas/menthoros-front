import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchPlanDialog } from './BatchPlanDialog';
import { useBatchPlanGeneration } from '../../../hooks/useBatchPlanGeneration';
import type { BatchPlanJobStatus } from '../../../types/BatchPlanJob';

vi.mock('../../../hooks/useBatchPlanGeneration');

type HookReturn = ReturnType<typeof useBatchPlanGeneration>;

const mockHook = (over: Partial<HookReturn>): void => {
    vi.mocked(useBatchPlanGeneration).mockReturnValue({
        jobId: null,
        status: null,
        loading: false,
        error: null,
        gerarLote: vi.fn().mockResolvedValue({ jobId: 'j1', totalAtletas: 2 }),
        reset: vi.fn(),
        ...over,
    });
};

const status = (over: Partial<BatchPlanJobStatus>): BatchPlanJobStatus => ({
    jobId: 'j1',
    status: 'EM_PROGRESSO',
    totalAtletas: 3,
    gerados: 0,
    erros: 0,
    geradosDetalhes: [],
    errosDetalhes: [],
    ...over,
});

describe('BatchPlanDialog', () => {
    beforeEach(() => vi.clearAllMocks());

    it('exibe a confirmação antes do disparo e chama gerarLote ao confirmar', async () => {
        const gerarLote = vi.fn().mockResolvedValue({ jobId: 'j1', totalAtletas: 2 });
        mockHook({ gerarLote });

        render(<BatchPlanDialog open onClose={vi.fn()} atletaIds={['a1', 'a2']} />);

        expect(screen.getByText(/Aguardando Revisão/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Gerar 2 plano/ })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /Gerar 2 plano/ }));
        expect(gerarLote).toHaveBeenCalledWith(['a1', 'a2'], 'PROXIMA_SEMANA');
    });

    it('exibe o progresso durante a geração', () => {
        mockHook({ jobId: 'j1', status: status({ gerados: 1, erros: 0 }) });

        render(<BatchPlanDialog open onClose={vi.fn()} atletaIds={['a1', 'a2', 'a3']} />);

        expect(screen.getByText(/1 de 3 processado/)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('exibe o resultado ao concluir e revela os erros sob demanda', async () => {
        const onConcluido = vi.fn();
        mockHook({
            jobId: 'j1',
            status: status({
                status: 'CONCLUIDO_COM_ERROS',
                gerados: 2,
                erros: 1,
                errosDetalhes: [{ atletaId: 'a3', motivo: 'Atleta não encontrado' }],
            }),
        });

        render(<BatchPlanDialog open onClose={vi.fn()} atletaIds={['a1', 'a2', 'a3']} onConcluido={onConcluido} />);

        expect(screen.getByText(/2 plano\(s\) gerado/)).toBeInTheDocument();
        expect(onConcluido).toHaveBeenCalled();

        expect(screen.queryByText('Atleta não encontrado')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /Ver detalhes dos erros/ }));
        expect(screen.getByText('Atleta não encontrado')).toBeInTheDocument();
    });
});
