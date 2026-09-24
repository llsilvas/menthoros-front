import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlanoDetalhePanel } from './PlanoDetalhePanel';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';

/**
 * show-descanso-no-plano — descanso no painel do treinador (CA1, CA2, CA3b, CA7, CA8).
 *
 * O `reason` aqui é texto de treinador e aparece como veio; quem nunca pode vê-lo é o atleta
 * (isso é testado na agenda).
 */

const MOTIVO = 'Readiness do dia é DESCANSAR, TSB -11,8 (limiar -25)';

const BASE: PlanoSemanalDto = {
    id: 'plano-1',
    semanaInicio: '2026-09-21',
    semanaFim: '2026-09-27',
    volumePlanejadoKm: 30,
    volumeRealizadoKm: 0,
    volumeAlvoKm: 30,
    status: 'PLANEJADO',
    reviewStatus: 'AGUARDANDO_REVISAO',
    atletaNome: 'Leandro Silva',
    treinosPlanejados: [
        { id: 't1', diaSemana: 'SEGUNDA', tipoTreino: 'CONTINUO', distanciaKm: 8 },
        { id: 't2', diaSemana: 'SABADO', tipoTreino: 'LONGO', distanciaKm: 12 },
    ],
};

function renderPanel(plano: PlanoSemanalDto, onPrescreverNoDia?: (dataTreino: string) => void) {
    return render(
        <PlanoDetalhePanel
            plano={plano}
            isActing={false}
            onAprovar={vi.fn()}
            onRejeitar={vi.fn()}
            onPrescreverNoDia={onPrescreverNoDia}
        />,
    );
}

describe('PlanoDetalhePanel — descanso prescrito', () => {
    it('CA1: mostra chip "Descanso" com o motivo, sem duração', () => {
        renderPanel({ ...BASE, restDays: [{ dayOfWeek: 'QUINTA', reason: MOTIVO }] });

        const chip = screen.getByTestId('chip-descanso-QUINTA');
        expect(chip).toHaveTextContent('Descanso');
        expect(chip).toHaveTextContent(MOTIVO);
        expect(within(chip).queryByText(/min/i)).toBeNull();
    });

    it('CA6: o chip de descanso entra na ordem da semana, entre os treinos', () => {
        renderPanel({ ...BASE, restDays: [{ dayOfWeek: 'QUINTA', reason: MOTIVO }] });

        const itens = screen.getAllByTestId(/^(chip-descanso-|tag-treino-)/);
        expect(itens.map((e) => e.getAttribute('data-testid'))).toEqual([
            'tag-treino-t1',
            'chip-descanso-QUINTA',
            'tag-treino-t2',
        ]);
    });

    it('CA2b: sem descanso, a lista sai ordenada mesmo vindo fora de ordem do backend', () => {
        renderPanel({
            ...BASE,
            treinosPlanejados: [
                { id: 'sex', diaSemana: 'SEXTA', tipoTreino: 'CONTINUO', distanciaKm: 5 },
                { id: 'seg', diaSemana: 'SEGUNDA', tipoTreino: 'CONTINUO', distanciaKm: 5 },
            ],
        });

        const itens = screen.getAllByTestId(/^tag-treino-/);
        expect(itens.map((e) => e.getAttribute('data-testid'))).toEqual([
            'tag-treino-seg',
            'tag-treino-sex',
        ]);
    });

    it.each([
        ['ausente', undefined],
        ['null', null],
        ['vazio', []],
    ])('CA2a: restDays %s não renderiza nenhum chip de descanso', (_nome, restDays) => {
        renderPanel({ ...BASE, restDays: restDays as never });

        expect(screen.queryByTestId(/^chip-descanso-/)).toBeNull();
        expect(screen.getAllByTestId(/^tag-treino-/)).toHaveLength(2);
    });

    it('CA8: semana só com descansos não cai no "Nenhuma sessão disponível"', () => {
        renderPanel({
            ...BASE,
            treinosPlanejados: [],
            restDays: [{ dayOfWeek: 'QUINTA', reason: MOTIVO }],
        });

        expect(screen.queryByText(/Nenhuma sessão disponível/i)).toBeNull();
        expect(screen.getByTestId('chip-descanso-QUINTA')).toBeInTheDocument();
    });

    it('plano sem treino e sem descanso mantém o estado vazio de hoje', () => {
        renderPanel({ ...BASE, treinosPlanejados: [], restDays: [] });

        expect(screen.getByText(/Nenhuma sessão disponível/i)).toBeInTheDocument();
    });

    it('CA7: o chip tem rótulo acessível com dia e motivo', () => {
        renderPanel({ ...BASE, restDays: [{ dayOfWeek: 'QUINTA', reason: MOTIVO }] });

        expect(screen.getByTestId('chip-descanso-QUINTA'))
            .toHaveAccessibleName(`Descanso na quinta: ${MOTIVO}`);
    });

    it('CA3: a ação de prescrever manda a data daquele dia da semana do plano', async () => {
        const onPrescreverNoDia = vi.fn();
        const { default: userEvent } = await import('@testing-library/user-event');
        renderPanel({ ...BASE, restDays: [{ dayOfWeek: 'QUINTA', reason: MOTIVO }] }, onPrescreverNoDia);

        await userEvent.click(screen.getByTestId('acao-prescrever-QUINTA'));

        // semanaInicio 2026-09-21 é segunda; quinta é 2026-09-24
        expect(onPrescreverNoDia).toHaveBeenCalledWith('2026-09-24');
    });

    it('CA3b: plano fora de AGUARDANDO_REVISAO não oferece a ação', () => {
        renderPanel(
            { ...BASE, reviewStatus: 'APROVADO', restDays: [{ dayOfWeek: 'QUINTA', reason: MOTIVO }] },
            vi.fn(),
        );

        expect(screen.getByTestId('chip-descanso-QUINTA')).toBeInTheDocument();
        expect(screen.queryByTestId('acao-prescrever-QUINTA')).toBeNull();
    });
});
