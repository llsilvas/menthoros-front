import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnaliseService } from '../../../api/services/AnaliseService';
import { TreinoService } from '../../../api/services/TreinoService';
import * as useTreinoHook from '../../../hooks/useTreinoPlanejado';
import type { PlanoVigenteDto } from '../../../types/AtletaPerfilCoach';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';
import { CurrentWeekPlan } from './CurrentWeekPlan';
import { PlanoDetalhePanel } from './PlanoDetalhePanel';

vi.mock('../../../api/services/TreinoService');
vi.mock('../../../api/services/AnaliseService');
vi.mock('../../../hooks/useTreinoPlanejado');

const PLANO_VIGENTE: PlanoVigenteDto = {
    planoId: 'p1',
    semanaInicio: '2026-06-23',
    semanaFim: '2026-06-29',
    reviewStatus: 'APROVADO',
    treinos: [
        { id: 't1', diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 10, statusExecucao: 'REALIZADO', treinoRealizadoId: 'tr-1' },
        { id: 't2', diaSemana: 'QUARTA', tipoTreino: 'TEMPO', distanciaKm: 12, statusExecucao: 'PENDENTE' },
    ],
};

const PLANO_REVIEW: PlanoSemanalDto = {
    id: 'p1',
    semanaInicio: '2026-09-07',
    semanaFim: '2026-09-13',
    volumePlanejadoKm: 22,
    volumeRealizadoKm: 10,
    volumeAlvoKm: 22,
    status: 'EM_ANDAMENTO',
    reviewStatus: 'APROVADO',
    atletaNome: 'Ana Silva',
    objetivoSemanal: 'Base',
    treinosPlanejados: [
        { id: 't1', diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 10, treinoRealizadoId: 'tr-1' },
        { id: 't2', diaSemana: 'QUARTA', tipoTreino: 'TEMPO', distanciaKm: 12 },
    ],
};

describe('Ver realizado nos cards do coach', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(TreinoService.obterRealizado).mockResolvedValue({ id: 'tr-1', distanciaKm: 10.2, percepcaoEsforco: 5 });
        vi.mocked(AnaliseService.getAnaliseTreino).mockResolvedValue(undefined as never);
        vi.mocked(useTreinoHook.useTreinoPlanejado).mockReturnValue({
            isSaving: false, isDeleting: false, saveError: null, deleteError: null,
            editarTreino: vi.fn(), adicionarTreino: vi.fn(), excluirTreino: vi.fn(),
        });
    });

    it('shell (CurrentWeekPlan): botão só no treino com vínculo; abre o dialog do realizado certo', async () => {
        render(<CurrentWeekPlan plano={PLANO_VIGENTE} onGerarPlano={vi.fn()} onRevisarPlano={vi.fn()} />);

        const botoes = screen.getAllByRole('button', { name: 'Ver realizado' });
        expect(botoes).toHaveLength(1);

        await userEvent.click(botoes[0]);

        expect(await screen.findByRole('columnheader', { name: 'Diferença' })).toBeInTheDocument();
        expect(TreinoService.obterRealizado).toHaveBeenCalledWith('tr-1');
        // Sem estado do card, o dialog busca a análise uma vez, depois do detalhe
        expect(await screen.findByText('Análise da IA indisponível para este treino no momento')).toBeInTheDocument();
        expect(AnaliseService.getAnaliseTreino).toHaveBeenCalledTimes(1);
    });

    it('revisão (PlanoDetalhePanel): botão só no treino com vínculo', async () => {
        render(<PlanoDetalhePanel plano={PLANO_REVIEW} isActing={false} onAprovar={vi.fn()} onRejeitar={vi.fn()} />);

        const botoes = screen.getAllByRole('button', { name: 'Ver realizado' });
        expect(botoes).toHaveLength(1);

        await userEvent.click(botoes[0]);

        expect(await screen.findByRole('columnheader', { name: 'Diferença' })).toBeInTheDocument();
        expect(TreinoService.obterRealizado).toHaveBeenCalledWith('tr-1');
    });
});
