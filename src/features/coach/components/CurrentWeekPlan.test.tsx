import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurrentWeekPlan } from './CurrentWeekPlan';
import type { PlanoVigenteDto, TreinoPlanejadoResumoDto } from '../../../types/AtletaPerfilCoach';
import * as useEditHook from '../../../hooks/useEditTreinoPlanejado';

vi.mock('../../../hooks/useEditTreinoPlanejado');

const TREINO_SEGUNDA: TreinoPlanejadoResumoDto = {
    id: 'treino-1',
    diaSemana: 'SEGUNDA',
    tipoTreino: 'FACIL',
    distanciaKm: 10,
    statusExecucao: 'PENDENTE',
    duracaoMin: 'PT60M',
    zonaAlvo: 'Z2',
    percepcaoEsforcoEsperada: 5,
};

const TREINO_QUARTA: TreinoPlanejadoResumoDto = {
    id: 'treino-2',
    diaSemana: 'QUARTA',
    tipoTreino: 'TEMPO',
    distanciaKm: 12,
    statusExecucao: 'PENDENTE',
    duracaoMin: 'PT1H30M',
    zonaAlvo: 'Z4',
    percepcaoEsforcoEsperada: 7,
};

const PLANO_APROVADO: PlanoVigenteDto = {
    planoId: 'plano-1',
    semanaInicio: '2026-06-23',
    semanaFim: '2026-06-29',
    reviewStatus: 'APROVADO',
    treinos: [TREINO_SEGUNDA, TREINO_QUARTA],
};

const PLANO_AGUARDANDO: PlanoVigenteDto = {
    ...PLANO_APROVADO,
    reviewStatus: 'AGUARDANDO_REVISAO',
};

const mockEditarTreino = vi.fn();

function stubEditHook(isSaving = false) {
    vi.mocked(useEditHook.useEditTreinoPlanejado).mockReturnValue({
        isSaving,
        editarTreino: mockEditarTreino,
    });
}

describe('CurrentWeekPlan', () => {
    const onGerarPlano = vi.fn();
    const onRevisarPlano = vi.fn();
    const onTreinoEditado = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        stubEditHook();
    });

    it('exibe botão Gerar Plano quando plano é null', () => {
        render(
            <CurrentWeekPlan
                plano={null}
                onGerarPlano={onGerarPlano}
                onRevisarPlano={onRevisarPlano}
            />,
        );
        expect(screen.getByRole('button', { name: /gerar plano/i })).toBeInTheDocument();
    });

    it('exibe cards de treino com tipo, distância e duração quando plano APROVADO', () => {
        render(
            <CurrentWeekPlan
                plano={PLANO_APROVADO}
                onGerarPlano={onGerarPlano}
                onRevisarPlano={onRevisarPlano}
            />,
        );

        expect(screen.getByText('FACIL')).toBeInTheDocument();
        expect(screen.getByText(/10\.0 km/)).toBeInTheDocument();
        expect(screen.getByText(/60 min/)).toBeInTheDocument();
    });

    it('exibe zona alvo e RPE nos cards', () => {
        render(
            <CurrentWeekPlan
                plano={PLANO_APROVADO}
                onGerarPlano={onGerarPlano}
                onRevisarPlano={onRevisarPlano}
            />,
        );

        expect(screen.getByText(/Z2/)).toBeInTheDocument();
        expect(screen.getByText(/RPE 5/)).toBeInTheDocument();
    });

    it('converte corretamente PT1H30M para 90 min', () => {
        render(
            <CurrentWeekPlan
                plano={PLANO_APROVADO}
                onGerarPlano={onGerarPlano}
                onRevisarPlano={onRevisarPlano}
            />,
        );

        expect(screen.getByText(/90 min/)).toBeInTheDocument();
    });

    it('NÃO exibe botão editar quando plano APROVADO', () => {
        render(
            <CurrentWeekPlan
                plano={PLANO_APROVADO}
                onGerarPlano={onGerarPlano}
                onRevisarPlano={onRevisarPlano}
            />,
        );

        expect(screen.queryByRole('button', { name: /editar treino/i })).not.toBeInTheDocument();
    });

    it('exibe banner + treinos + botões editar quando AGUARDANDO_REVISAO', () => {
        render(
            <CurrentWeekPlan
                plano={PLANO_AGUARDANDO}
                onGerarPlano={onGerarPlano}
                onRevisarPlano={onRevisarPlano}
                onTreinoEditado={onTreinoEditado}
            />,
        );

        expect(screen.getByText(/aguardando revisão/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /revisar/i })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /editar treino/i }).length).toBeGreaterThanOrEqual(1);
    });

    it('clicar editar abre dialog com campos do treino', () => {
        render(
            <CurrentWeekPlan
                plano={PLANO_AGUARDANDO}
                onGerarPlano={onGerarPlano}
                onRevisarPlano={onRevisarPlano}
                onTreinoEditado={onTreinoEditado}
            />,
        );

        fireEvent.click(screen.getAllByRole('button', { name: /editar treino/i })[0]);

        expect(screen.getByText('Editar treino')).toBeInTheDocument();
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    it('salvar chama editarTreino e onTreinoEditado', async () => {
        mockEditarTreino.mockResolvedValue({ id: 'treino-1' });

        render(
            <CurrentWeekPlan
                plano={PLANO_AGUARDANDO}
                onGerarPlano={onGerarPlano}
                onRevisarPlano={onRevisarPlano}
                onTreinoEditado={onTreinoEditado}
            />,
        );

        fireEvent.click(screen.getAllByRole('button', { name: /editar treino/i })[0]);

        const distInput = screen.getByDisplayValue('10');
        fireEvent.change(distInput, { target: { value: '15' } });

        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        await waitFor(() => {
            expect(mockEditarTreino).toHaveBeenCalledWith(
                'plano-1',
                'treino-1',
                expect.objectContaining({ distanciaKm: 15 }),
            );
            expect(onTreinoEditado).toHaveBeenCalled();
        });
    });
});
