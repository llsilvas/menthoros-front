import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlanoDetalhePanel } from './PlanoDetalhePanel';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';

const BASE: PlanoSemanalDto = {
    id: 'plano-1',
    semanaInicio: '2026-09-07',
    semanaFim: '2026-09-13',
    volumePlanejadoKm: 45,
    volumeRealizadoKm: 0,
    volumeAlvoKm: 45,
    status: 'PLANEJADO',
    reviewStatus: 'AGUARDANDO_REVISAO',
    atletaNome: 'Ana Silva',
    objetivoSemanal: 'Semana base aeróbica',
    treinosPlanejados: [
        { id: 't1', diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 10 },
        {
            id: 't2', diaSemana: 'DOMINGO', tipoTreino: 'PROVA', distanciaKm: 21.1,
            descricao: 'Meia Maratona de SP', provaId: 'prova-1',
        },
    ],
};

function renderPanel(plano: PlanoSemanalDto) {
    return render(
        <PlanoDetalhePanel
            plano={plano}
            isActing={false}
            onAprovar={vi.fn()}
            onRejeitar={vi.fn()}
        />,
    );
}

describe('PlanoDetalhePanel — reabertura por prova (prova-no-plano-semanal, D4)', () => {
    it('sem motivoReabertura, não mostra o chip', () => {
        renderPanel(BASE);
        expect(screen.queryByTestId('chip-reaberto')).toBeNull();
    });

    it('motivoReabertura = PROVA_INSERIDA mostra "Reaberto: prova inserida"', () => {
        renderPanel({ ...BASE, motivoReabertura: 'PROVA_INSERIDA' });
        expect(screen.getByTestId('chip-reaberto')).toHaveTextContent('Reaberto: prova inserida');
    });

    it('motivoReabertura = PROVA_REMOVIDA mostra "Reaberto: prova removida"', () => {
        renderPanel({ ...BASE, motivoReabertura: 'PROVA_REMOVIDA' });
        expect(screen.getByTestId('chip-reaberto')).toHaveTextContent('Reaberto: prova removida');
    });
});

describe('PlanoDetalhePanel — revisão obrigatória do planner (planner-engine-enforcement §7.2)', () => {
    it('sem campos de planner (plano legado), não mostra o bloco de revisão', () => {
        renderPanel(BASE);
        expect(screen.queryByTestId('planner-review-block')).toBeNull();
    });

    it('compliance FAILED mostra o badge "Revisão obrigatória" e os motivos', () => {
        renderPanel({
            ...BASE,
            plannerComplianceStatus: 'FAILED',
            plannerRequiresCoachReview: true,
            plannerReviewReasons: ['treino em dia não disponível', 'carga alta na semana de taper'],
        });
        const bloco = screen.getByTestId('planner-review-block');
        expect(bloco).toHaveTextContent('Revisão obrigatória');
        expect(bloco).toHaveTextContent('treino em dia não disponível');
        expect(bloco).toHaveTextContent('carga alta na semana de taper');
    });

    it('plano PASSED não exibe destaque', () => {
        renderPanel({ ...BASE, plannerComplianceStatus: 'PASSED', plannerRequiresCoachReview: false });
        expect(screen.queryByTestId('planner-review-block')).toBeNull();
    });
});

describe('PlanoDetalhePanel — treino PROVA com o mesmo destaque da agenda', () => {
    it('mostra o nome da prova em vez do rótulo genérico do tipo', () => {
        renderPanel(BASE);
        expect(screen.getByText('Meia Maratona de SP')).toBeInTheDocument();
        expect(screen.queryByText('PROVA')).toBeNull();
    });

    it('mostra o ícone de bandeira só no treino PROVA', () => {
        renderPanel(BASE);
        expect(screen.getAllByTestId('icone-prova')).toHaveLength(1);
    });

    it('treino comum não ganha o ícone de bandeira nem usa descricao como rótulo', () => {
        const soComuns: PlanoSemanalDto = { ...BASE, treinosPlanejados: [BASE.treinosPlanejados![0]] };
        renderPanel(soComuns);
        expect(screen.queryByTestId('icone-prova')).toBeNull();
        // Rótulo humano, não o enum ("FACIL").
        expect(screen.getByText('Fácil')).toBeInTheDocument();
    });
});

// ── improve-plan-edit-usability ───────────────────────────────────────────────

describe('PlanoDetalhePanel — card do treino legível e acionável', () => {
    const comJustificativa: PlanoSemanalDto = {
        ...BASE,
        treinosPlanejados: [
            {
                id: 't1', diaSemana: 'TERCA', tipoTreino: 'INTERVALADO', distanciaKm: 10,
                duracaoMin: 'PT55M', zonaAlvo: 'Z4', percepcaoEsforcoEsperada: 8,
                justificativaIa: 'Estímulo de limiar antes da semana de prova.',
                editadoPeloCoach: true,
            },
        ],
    };

    it('mostra a justificativa da IA no card — é o que o treinador precisa para decidir', () => {
        renderPanel(comJustificativa);

        expect(screen.getByTestId('treino-justificativa')).toHaveTextContent('Estímulo de limiar antes da semana de prova.');
    });

    it('dia vem com a data da semana do plano ("Ter 08/09")', () => {
        renderPanel(comJustificativa);

        expect(screen.getByText('Ter 08/09')).toBeInTheDocument();
    });

    it('o corpo do card abre a edição quando o plano aguarda revisão', async () => {
        const onEditarTreino = vi.fn();
        render(
            <PlanoDetalhePanel plano={comJustificativa} isActing={false} onAprovar={vi.fn()} onRejeitar={vi.fn()} onEditarTreino={onEditarTreino} />,
        );

        await userEvent.click(screen.getByRole('button', { name: /abrir treino de ter 08\/09/i }));

        expect(onEditarTreino).toHaveBeenCalledWith('t1');
    });

    it('plano aprovado: corpo do card não é botão', () => {
        render(
            <PlanoDetalhePanel plano={{ ...comJustificativa, reviewStatus: 'APROVADO' }} isActing={false} onAprovar={vi.fn()} onRejeitar={vi.fn()} onEditarTreino={vi.fn()} />,
        );

        expect(screen.queryByRole('button', { name: /abrir treino/i })).not.toBeInTheDocument();
    });

    it('legenda dos marcadores aparece só quando algum card os mostra', () => {
        renderPanel(comJustificativa);
        expect(screen.getByTestId('legenda-marcadores')).toHaveTextContent('editado por você');
        expect(screen.getByTestId('legenda-marcadores')).not.toHaveTextContent('adicionado por você');
    });

    it('sem marcadores, sem legenda', () => {
        renderPanel(BASE);
        expect(screen.queryByTestId('legenda-marcadores')).not.toBeInTheDocument();
    });
});
