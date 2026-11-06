import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import PlanosDialog from './planosDialog';
import { usePlanoSemanal } from '../../../hooks/usePlanoSemanal';
import { useBatchPlanGeneration } from '../../../hooks/useBatchPlanGeneration';
import type { BatchPlanJobStatus } from '../../../types/BatchPlanJob';
import { useTreinoPlanejado } from '../../../hooks/useTreinoPlanejado';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import { ApiError } from '../../../api/core/ApiError';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import type { ConexaoCanalDto } from '../../../types/AtletaPerfilCoach';

vi.mock('../../../hooks/usePlanoSemanal');
vi.mock('../../../hooks/useBatchPlanGeneration');
vi.mock('../../../api/services/AtletasService');
vi.mock('../../../api/services/TreinoService');
vi.mock('../../../hooks/useTreinoPlanejado');
vi.mock('../../../hooks/useAthleteTrainingZones');

type PlanoHook = ReturnType<typeof usePlanoSemanal>;
type BatchHook = ReturnType<typeof useBatchPlanGeneration>;

const fetchPlanosPorAtleta = vi.fn().mockResolvedValue('ok');

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

const mockEditar = vi.fn();

beforeEach(() => {
    vi.mocked(useTreinoPlanejado).mockReturnValue({
        isSaving: false, isDeleting: false, saveError: null, deleteError: null,
        editarTreino: mockEditar, adicionarTreino: vi.fn(), excluirTreino: vi.fn(),
    });
    vi.mocked(useAthleteTrainingZones).mockReturnValue({ zones: null, loading: false, error: null, fetchZones: vi.fn() });
});

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

describe('PlanosDialog — faixa de KPIs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('mostra planejado, realizado e treinos, sem "Volume alvo" (igual ao planejado)', () => {
        mockBatchHook();
        mockPlanoHook({
            planos: [
                {
                    id: 'p1',
                    semanaInicio: '2026-09-28',
                    semanaFim: '2026-10-04',
                    status: 'ATIVO',
                    volumePlanejadoKm: 42,
                    volumeAlvoKm: 42,
                    treinosPlanejados: [],
                } as unknown as PlanoHook['planos'][number],
            ],
        });

        render(<PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" />);

        expect(screen.getByText('Volume planejado')).toBeInTheDocument();
        expect(screen.getByText('Volume realizado')).toBeInTheDocument();
        expect(screen.getByText('Treinos')).toBeInTheDocument();
        expect(screen.queryByText('Volume alvo')).toBeNull();
    });
});

// JSON da listagem `GET /planos/atletas/{id}/semanas` como o backend da change serializa.
const GARMIN_ATIVO: ConexaoCanalDto = {
    plataforma: { value: 'GARMIN', label: 'Garmin' }, ativo: true, workoutImport: true, activityExport: true,
};

function treinoListagem(over: Partial<TreinoPlanejado> = {}): TreinoPlanejado {
    return {
        id: 't1',
        tipoTreino: { value: 'CONTINUO', label: 'Contínuo' },
        diaSemana: { value: 'QUINTA', label: 'Quinta' },
        dataTreino: '2026-11-06',
        distanciaKm: 12,
        duracaoMin: '01:05:00',
        observacao: 'Segurar o ritmo',
        zonaAlvo: 'Z2',
        percepcaoEsforcoEsperada: 5,
        tssPlanejado: 88,
        statusTreino: { value: 'PENDENTE', label: 'Pendente' },
        editable: true,
        etapas: [
            { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 15, fcAlvoEtapa: '120-140 bpm', alvoPrimario: 'FC' },
            { ordem: 2, tipoEtapa: 'PRINCIPAL', duracaoMin: 50, distanciaKm: 10, ritmoAlvo: '5:00-5:10/km', alvoPrimario: 'PACE' },
        ],
        ...over,
    } as unknown as TreinoPlanejado;
}

function planoListagem(over: Partial<PlanoSemanal> = {}, treino: TreinoPlanejado = treinoListagem()): PlanoSemanal {
    return {
        id: 'p1',
        atletaId: 'a1',
        semanaInicio: '2026-11-02',
        semanaFim: '2026-11-08',
        status: 'ATIVO',
        volumePlanejadoKm: 40,
        volumeRealizadoKm: 0,
        volumeAlvoKm: 40,
        conexaoCanal: GARMIN_ATIVO,
        treinosPlanejados: [treino],
        ...over,
    };
}

const apiError = (status: number, message: string) => new ApiError(
    { method: 'PATCH', url: '/x' },
    { url: '/x', ok: false, status, statusText: 'Erro', body: { message } },
    message,
);

const lapis = () => screen.getByRole('button', { name: /editar treino/i });
const editorAberto = () => screen.queryByText(/este treino faz parte de um plano já aprovado/i);
const mudarDuracaoPrincipal = (min: string) => {
    const duracoes = screen.getAllByLabelText(/Duração \(m:ss\)/i);
    fireEvent.change(duracoes[duracoes.length - 1], { target: { value: min } });
};

describe('PlanosDialog — editar treino de plano aprovado', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        fetchPlanosPorAtleta.mockResolvedValue('ok');
        mockEditar.mockResolvedValue({});
        mockBatchHook();
    });

    const abrirDialog = (planos: PlanoSemanal[] = [planoListagem()], atletaId = 'a1') => {
        mockPlanoHook({ planos });
        return render(<PlanosDialog open onClose={vi.fn()} atletaId={atletaId} atletaNome="Ana" />);
    };

    it('lápis abre o editor com 1h05, TSS, observação e o seletor de motivo', async () => {
        abrirDialog();

        await userEvent.click(lapis());

        expect(editorAberto()).toBeInTheDocument();
        expect(screen.getAllByText('1h05').length).toBeGreaterThan(0);
        expect(screen.getByLabelText(/TSS planejado/i)).toHaveValue(88);
        expect(screen.getByLabelText(/Observação/i)).toHaveValue('Segurar o ritmo');
        expect(screen.getByRole('button', { name: 'Carga' })).toBeInTheDocument();
    });

    it('mudar só a duração manda PATCH para o plano/treino capturados com duração e motivo, sem observação/TSS/tipo/zona', async () => {
        abrirDialog();
        await userEvent.click(lapis());

        mudarDuracaoPrincipal('55');
        fireEvent.click(screen.getByRole('button', { name: 'Carga' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        await waitFor(() => expect(mockEditar).toHaveBeenCalledTimes(1));
        const [planoId, treinoId, patch] = mockEditar.mock.calls[0];
        expect(planoId).toBe('p1');
        expect(treinoId).toBe('t1');
        expect(patch).toMatchObject({ duracaoMin: 'PT70M', editReason: 'LOAD' });
        for (const campo of ['observacao', 'tssPlanejado', 'tipoTreino', 'zonaAlvo']) {
            expect(patch).not.toHaveProperty(campo);
        }
    });

    it.each([['01:05:00'], ['45:30']])('abrir e salvar sem mexer (duração %s) não manda PATCH nem duração', async (duracao) => {
        abrirDialog([planoListagem({}, treinoListagem({ duracaoMin: duracao }))]);
        await userEvent.click(lapis());

        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        expect(mockEditar).not.toHaveBeenCalled();
        await waitFor(() => expect(editorAberto()).toBeNull());
    });

    it('reload em segundo plano e troca de semana não fecham o editor, que salva no treino original', async () => {
        const { rerender } = abrirDialog();
        await userEvent.click(lapis());
        mudarDuracaoPrincipal('55');

        mockPlanoHook({ planos: [planoListagem()], loading: true });
        rerender(<PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" />);
        mockPlanoHook({ planos: [planoListagem({ id: 'p0', semanaInicio: '2026-10-26', semanaFim: '2026-11-01', status: 'CONCLUIDO' }, treinoListagem({ id: 't0' }))] });
        rerender(<PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" />);

        expect(editorAberto()).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        await waitFor(() => expect(mockEditar).toHaveBeenCalledWith('p1', 't1', expect.objectContaining({ duracaoMin: 'PT70M' })));
    });

    it('Garmin ativo: aviso cita o Garmin Connect e o botão é "Salvar e reenviar"', async () => {
        abrirDialog();
        await userEvent.click(lapis());

        expect(screen.getByText(/já está no Garmin Connect de Ana/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar e reenviar' })).toBeInTheDocument();
    });

    it.each([
        ['revogada', { conexaoCanal: { ...GARMIN_ATIVO, ativo: false } }],
        ['ausente', { conexaoCanal: undefined }],
    ])('conexão %s: texto neutro e botão "Salvar", nunca "só no app"', async (_, over) => {
        abrirDialog([planoListagem(over)]);
        await userEvent.click(lapis());

        expect(screen.getByText('Se o atleta usa relógio, a versão nova será reenviada.')).toBeInTheDocument();
        expect(screen.queryByText(/só no app/i)).toBeNull();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    });

    it('422/409 no PATCH mantém o editor aberto com a mensagem do backend', async () => {
        mockEditar.mockRejectedValue(apiError(422, 'Treino de dia passado não pode ser editado.'));
        abrirDialog();
        await userEvent.click(lapis());
        mudarDuracaoPrincipal('55');

        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        expect(await screen.findByText('Treino de dia passado não pode ser editado.')).toBeInTheDocument();
        expect(editorAberto()).toBeInTheDocument();
        expect(fetchPlanosPorAtleta).not.toHaveBeenCalledTimes(2);
    });

    it('PATCH ok e reload com falha: fecha o editor e avisa "Treino salvo; não foi possível atualizar a lista"', async () => {
        abrirDialog();
        await userEvent.click(lapis());
        mudarDuracaoPrincipal('55');
        fetchPlanosPorAtleta.mockResolvedValue('falha');

        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        expect(await screen.findByText('Treino salvo; não foi possível atualizar a lista')).toBeInTheDocument();
        await waitFor(() => expect(editorAberto()).toBeNull());
        expect(fetchPlanosPorAtleta).toHaveBeenLastCalledWith('a1');
    });

    it('PATCH ok e reload obsoleto (fetch concorrente): fecha o editor sem aviso', async () => {
        abrirDialog();
        await userEvent.click(lapis());
        mudarDuracaoPrincipal('55');
        fetchPlanosPorAtleta.mockResolvedValue('obsoleta');

        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        await waitFor(() => expect(editorAberto()).toBeNull());
        await waitFor(() => expect(fetchPlanosPorAtleta).toHaveBeenCalledTimes(2));
        expect(screen.queryByText(/não foi possível atualizar a lista/i)).toBeNull();
    });

    it('fechar o PlanosDialog fecha o editor e descarta a edição', async () => {
        const { rerender } = abrirDialog();
        await userEvent.click(lapis());
        mudarDuracaoPrincipal('55');

        rerender(<PlanosDialog open={false} onClose={vi.fn()} atletaId="a1" atletaNome="Ana" />);
        await waitFor(() => expect(editorAberto()).toBeNull());
        rerender(<PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" />);

        expect(editorAberto()).toBeNull();
        expect(mockEditar).not.toHaveBeenCalled();
    });

    it('trocar de atleta fecha o editor', async () => {
        const { rerender } = abrirDialog();
        await userEvent.click(lapis());

        mockPlanoHook({ planos: [] });
        rerender(<PlanosDialog open onClose={vi.fn()} atletaId="a2" atletaNome="Bruno" />);

        await waitFor(() => expect(editorAberto()).toBeNull());
    });

    it('PATCH em voo quando troca de atleta: erro não aparece e sucesso não recarrega nem avisa', async () => {
        let rejeitar: (e: unknown) => void = () => {};
        mockEditar.mockReturnValue(new Promise((_, rej) => { rejeitar = rej; }));
        const { rerender } = abrirDialog();
        await userEvent.click(lapis());
        mudarDuracaoPrincipal('55');
        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));
        await waitFor(() => expect(mockEditar).toHaveBeenCalledTimes(1));

        mockPlanoHook({ planos: [] });
        rerender(<PlanosDialog open onClose={vi.fn()} atletaId="a2" atletaNome="Bruno" />);
        rejeitar(apiError(422, 'Mensagem do atleta anterior'));

        await waitFor(() => expect(editorAberto()).toBeNull());
        expect(screen.queryByText('Mensagem do atleta anterior')).toBeNull();
    });

    it('PATCH em voo com sucesso depois de trocar de atleta não recarrega o anterior nem avisa', async () => {
        let resolver: (v: unknown) => void = () => {};
        mockEditar.mockReturnValue(new Promise((res) => { resolver = res; }));
        fetchPlanosPorAtleta.mockResolvedValue('falha');
        const { rerender } = abrirDialog();
        await userEvent.click(lapis());
        mudarDuracaoPrincipal('55');
        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));
        await waitFor(() => expect(mockEditar).toHaveBeenCalledTimes(1));

        mockPlanoHook({ planos: [] });
        rerender(<PlanosDialog open onClose={vi.fn()} atletaId="a2" atletaNome="Bruno" />);
        fetchPlanosPorAtleta.mockClear();
        resolver({});

        await new Promise(r => setTimeout(r, 0));
        expect(fetchPlanosPorAtleta).not.toHaveBeenCalledWith('a1');
        expect(screen.queryByText(/não foi possível atualizar a lista/i)).toBeNull();
    });

    it('plano concluído com treino editado: selo, sem lápis nem cadeado', () => {
        abrirDialog([planoListagem({ status: 'CONCLUIDO' }, treinoListagem({ editable: undefined, editedAfterApprovalAt: '2026-11-04T12:00:00Z' }))]);

        expect(screen.getByText('Editado após aprovação')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /editar treino/i })).toBeNull();
    });
});
