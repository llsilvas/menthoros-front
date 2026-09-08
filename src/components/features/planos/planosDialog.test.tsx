import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import PlanosDialog from './planosDialog';
import { usePlanoSemanal } from '../../../hooks/usePlanoSemanal';
import { useBatchPlanGeneration } from '../../../hooks/useBatchPlanGeneration';
import type { BatchPlanJobStatus } from '../../../types/BatchPlanJob';

vi.mock('../../../hooks/usePlanoSemanal');
vi.mock('../../../hooks/useBatchPlanGeneration');
vi.mock('../../../api/services/AtletasService');
vi.mock('../../../api/services/TreinoService');

type PlanoHook = ReturnType<typeof usePlanoSemanal>;
type BatchHook = ReturnType<typeof useBatchPlanGeneration>;

const fetchPlanosPorAtleta = vi.fn().mockResolvedValue(undefined);

const mockPlanoHook = (over: Partial<PlanoHook> = {}): void => {
    vi.mocked(usePlanoSemanal).mockReturnValue({
        planos: [],
        loading: false,
        error: null,
        fetchPlanosPorAtleta,
        deletePlano: vi.fn().mockResolvedValue(undefined),
        clearError: vi.fn(),
        clearPlanos: vi.fn(),
        ...over,
    });
};

const mockBatchHook = (over: Partial<BatchHook> = {}): BatchHook => {
    const hook: BatchHook = {
        jobId: null,
        status: null,
        loading: false,
        error: null,
        gerarLote: vi.fn().mockResolvedValue({ jobId: 'job-1', totalAtletas: 1 }),
        reset: vi.fn(),
        ...over,
    };
    vi.mocked(useBatchPlanGeneration).mockReturnValue(hook);
    return hook;
};

const statusTerminal = (over: Partial<BatchPlanJobStatus>): BatchPlanJobStatus => ({
    jobId: 'job-1',
    status: 'CONCLUIDO',
    totalAtletas: 1,
    gerados: 1,
    erros: 0,
    geradosDetalhes: [],
    errosDetalhes: [],
    ...over,
});

describe('PlanosDialog — geração de plano (assíncrona)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('dispara a geração como lote de 1 pelo fluxo assíncrono (não mais o síncrono)', async () => {
        mockPlanoHook();
        const batch = mockBatchHook();

        render(<PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" />);
        await userEvent.click(screen.getByRole('button', { name: /gerar plano/i }));

        expect(batch.gerarLote).toHaveBeenCalledWith(['a1'], 'PROXIMA_SEMANA');
    });

    it('avisa o pai e relista quando o job conclui com sucesso', async () => {
        mockPlanoHook();
        // status terminal de sucesso já presente no render — o efeito de conclusão dispara.
        mockBatchHook({ status: statusTerminal({}) });
        const onPlanoGerado = vi.fn();

        render(<PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" onPlanoGerado={onPlanoGerado} />);

        await waitFor(() => expect(onPlanoGerado).toHaveBeenCalledTimes(1));
        expect(fetchPlanosPorAtleta).toHaveBeenCalledWith('a1');
    });

    it('NÃO avisa o pai quando o job termina com erro (CONCLUIDO_COM_ERROS)', async () => {
        mockPlanoHook();
        mockBatchHook({
            status: statusTerminal({
                status: 'CONCLUIDO_COM_ERROS',
                gerados: 0,
                erros: 1,
                errosDetalhes: [{ atletaId: 'a1', motivo: 'Já existe plano para a semana.' }],
            }),
        });
        const onPlanoGerado = vi.fn();

        render(<PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" onPlanoGerado={onPlanoGerado} />);

        // a mensagem de erro do job aparece e o pai não é avisado
        expect(await screen.findByText(/já existe plano para a semana/i)).toBeInTheDocument();
        expect(onPlanoGerado).not.toHaveBeenCalled();
    });

    it('bloqueia o botão de gerar enquanto o job está em andamento', () => {
        mockPlanoHook();
        mockBatchHook({ loading: true });

        render(<PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" />);

        expect(screen.getByRole('button', { name: /gerando/i })).toBeDisabled();
    });

    it('tela legada (sem PlanGenerationProvider): dispara a geração normalmente, sem erro (AC7)', async () => {
        mockPlanoHook();
        const batch = mockBatchHook();

        // Renderizado SEM o PlanGenerationProvider (como em AtletasList): as ações do provider caem
        // no nullStore (iniciar → true, anexarJob/liberar → no-op) e o fluxo local segue como antes.
        render(<PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" />);
        await userEvent.click(screen.getByRole('button', { name: /gerar plano/i }));

        expect(batch.gerarLote).toHaveBeenCalledWith(['a1'], 'PROXIMA_SEMANA');
    });

    it('reseta a geração ao trocar de atleta — não contamina o novo atleta com o job do anterior', () => {
        mockPlanoHook();
        const batch = mockBatchHook();

        const { rerender } = render(
            <PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" />,
        );
        const resetMock = batch.reset as unknown as Mock;
        const chamadasNoMount = resetMock.mock.calls.length;

        rerender(<PlanosDialog open onClose={vi.fn()} atletaId="a2" atletaNome="Bruno" />);

        // A troca de atleta dispara um reset adicional (para o polling do job do atleta anterior).
        expect(resetMock.mock.calls.length).toBeGreaterThan(chamadasNoMount);
    });
});
