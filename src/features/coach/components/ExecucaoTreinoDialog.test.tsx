import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnaliseService } from '../../../api/services/AnaliseService';
import { TreinoService } from '../../../api/services/TreinoService';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';
import type { TreinoRealizadoDetalhe } from '../../../types/TreinoRealizado';
import type { AnaliseTreinoRealizadoState } from '../hooks/useAnaliseTreinoRealizado';
import { ExecucaoTreinoDialog } from './ExecucaoTreinoDialog';

vi.mock('../../../api/services/TreinoService');
vi.mock('../../../api/services/AnaliseService');

const DETALHE: TreinoRealizadoDetalhe = {
    id: 'tr-1',
    duracaoMin: '01:40:32',
    distanciaKm: 15,
    fcMedia: 152,
    percepcaoEsforco: 7,
    tempoEmZonas: {
        fonte: 'FIT_RECORDS',
        zonas: [
            { zona: 'Z1', bpmMin: 93, bpmMax: 111, segundos: 100 },
            { zona: 'Z2', bpmMin: 112, bpmMax: 129, segundos: 700 },
            { zona: 'Z3', bpmMin: 130, bpmMax: 148, segundos: 200 },
            { zona: 'Z4', bpmMin: 149, bpmMax: 166, segundos: 0 },
            { zona: 'Z5', bpmMin: 167, segundos: 0 },
        ],
    },
    etapasRealizadas: [{ ordem: 1, duracao: '06:12', distanciaKm: 1, fcMedia: 140 }],
};
const ANALISE: AnaliseWorkout = {
    id: 'a1', treinoRealizadoId: 'tr-1', status: 'COMPLETED', primaryCause: 'PACING_ERROR',
    executionScore: 7, summary: 'Saiu forte demais', recommendation: 'Segurar o início',
};
const PLANEJADO = { distanciaKm: 14, duracaoMin: 'PT90M', zonaAlvo: 'Z2', percepcaoEsforcoEsperada: 6 };

const renderDialog = (analise?: AnaliseTreinoRealizadoState) =>
    render(<ExecucaoTreinoDialog open onClose={vi.fn()} treinoRealizadoId="tr-1" planejado={PLANEJADO} titulo="Longo" analise={analise} />);

const estado = (status: AnaliseTreinoRealizadoState['status'], data: AnaliseWorkout | null = null): AnaliseTreinoRealizadoState =>
    ({ status, data, refetch: vi.fn() });

describe('ExecucaoTreinoDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(TreinoService.obterRealizado).mockResolvedValue(DETALHE);
        vi.mocked(AnaliseService.getAnaliseTreino).mockResolvedValue(ANALISE);
    });

    it('mostra carregando e depois comparativo, zonas, etapas e o acordeão fechado', async () => {
        renderDialog();

        expect(screen.getByLabelText('Carregando treino realizado')).toBeInTheDocument();
        expect(await screen.findByRole('columnheader', { name: 'Diferença' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Longo · execução/ })).toBeInTheDocument();
        expect(screen.getByText('+1,00 km')).toBeInTheDocument();
        expect(screen.getByText('70% no alvo', { selector: 'p[data-tom]' })).toBeInTheDocument();
        expect(screen.getByText('1 voltas')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Todos os dados do relógio' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('erro na busca mostra "Tentar de novo", que busca outra vez', async () => {
        vi.mocked(TreinoService.obterRealizado).mockRejectedValueOnce(new Error('boom'));
        renderDialog();

        await userEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));

        expect(await screen.findByRole('columnheader', { name: 'Diferença' })).toBeInTheDocument();
        expect(TreinoService.obterRealizado).toHaveBeenCalledTimes(2);
    });

    it('sem o estado do card, busca a análise só depois do detalhe e mostra o banner', async () => {
        renderDialog();

        const banner = await screen.findByTestId('execucao-analise-banner');
        expect(within(banner).getByText('Erro de Ritmo')).toBeInTheDocument();
        expect(within(banner).getByText('7/10')).toBeInTheDocument();
        expect(within(banner).getByText('Saiu forte demais')).toBeInTheDocument();
        expect(within(banner).getByText(/Segurar o início/)).toBeInTheDocument();
        expect(AnaliseService.getAnaliseTreino).toHaveBeenCalledTimes(1);
    });

    it('com o estado do card, não chama o endpoint de análise', async () => {
        renderDialog(estado('pronta', ANALISE));

        await screen.findByTestId('execucao-analise-banner');
        expect(AnaliseService.getAnaliseTreino).not.toHaveBeenCalled();
    });

    it('indisponível com RPE mostra a faixa neutra', async () => {
        renderDialog(estado('indisponivel'));
        expect(await screen.findByText('Análise da IA indisponível para este treino no momento')).toBeInTheDocument();
    });

    it('sem RPE mostra a nota de dependência', async () => {
        renderDialog(estado('semRpe'));
        expect(await screen.findByText('A análise da IA depende do RPE do atleta')).toBeInTheDocument();
    });

    it('erro na análise: nenhum banner, o resto funciona', async () => {
        renderDialog(estado('erro'));

        await screen.findByRole('columnheader', { name: 'Diferença' });
        expect(screen.queryByTestId('execucao-analise-banner')).not.toBeInTheDocument();
        expect(screen.queryByText(/Análise da IA/)).not.toBeInTheDocument();
    });

    it('fechado não busca nada', () => {
        render(<ExecucaoTreinoDialog open={false} onClose={vi.fn()} treinoRealizadoId="tr-1" planejado={PLANEJADO} titulo="Longo" />);
        expect(TreinoService.obterRealizado).not.toHaveBeenCalled();
    });

    it('sem tempoEmZonas e sem voltas: estados vazios', async () => {
        vi.mocked(TreinoService.obterRealizado).mockResolvedValue({ id: 'tr-1', distanciaKm: 8 });
        renderDialog(estado('semRpe'));

        expect(await screen.findByText('Tempo em zonas indisponível para este treino')).toBeInTheDocument();
        expect(screen.getByText('Sem voltas registradas para este treino')).toBeInTheDocument();
    });
});
