import { render, screen } from '@testing-library/react';
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
        expect(screen.getByText('FACIL')).toBeInTheDocument();
    });
});
