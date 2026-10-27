import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TreinoPlanejadoCard } from './TreinoPlanejadoCard';
import { estadoDeExecucao } from './treinoPlanejadoEstado';
import { primary } from '../../../theme/tokens';

function renderCard(props: Partial<React.ComponentProps<typeof TreinoPlanejadoCard>> = {}) {
    return render(
        <TreinoPlanejadoCard
            dia="Ter 20/10"
            tipoTreino="INTERVALADO"
            rotulo="Intervalado"
            distanciaKm={10}
            duracaoMin={55}
            rpeEsperado={8}
            {...props}
        />,
    );
}

describe('TreinoPlanejadoCard', () => {
    it('mostra dia, tipo e as três métricas com unidade', () => {
        renderCard();

        expect(screen.getByText('Ter 20/10')).toBeInTheDocument();
        expect(screen.getByText('Intervalado')).toBeInTheDocument();
        expect(screen.getByText('10 km')).toBeInTheDocument();
        expect(screen.getByText('55 min')).toBeInTheDocument();
        expect(screen.getByText('8/10')).toBeInTheDocument();
    });

    it('duração e esforço ausentes viram "—", sem quebrar a grade', () => {
        renderCard({ duracaoMin: null, rpeEsperado: undefined });

        expect(screen.getAllByText('—')).toHaveLength(2);
    });

    it('zona e TSS só aparecem quando existem', () => {
        const { rerender } = renderCard();
        expect(screen.queryByText('Zona')).not.toBeInTheDocument();
        expect(screen.queryByText('TSS')).not.toBeInTheDocument();

        rerender(
            <TreinoPlanejadoCard dia="Ter 20/10" tipoTreino="INTERVALADO" rotulo="Intervalado" distanciaKm={10}
                zonaAlvo="Z4" tssPlanejado={75} />,
        );
        expect(screen.getByText('Z4')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('TSS zero é um valor, não ausência', () => {
        renderCard({ tssPlanejado: 0 });

        expect(screen.getByText('TSS')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('com onAbrir, o corpo é um botão nomeado pelo dia e dispara o callback', async () => {
        const onAbrir = vi.fn();
        renderCard({ onAbrir });

        await userEvent.click(screen.getByRole('button', { name: 'Abrir treino de Ter 20/10' }));

        expect(onAbrir).toHaveBeenCalledOnce();
    });

    it('sem onAbrir, não há botão de abrir', () => {
        renderCard();

        expect(screen.queryByRole('button', { name: /abrir treino/i })).not.toBeInTheDocument();
    });

    it('as ações do cabeçalho ficam fora do botão do corpo — sem botão aninhado', () => {
        renderCard({ onAbrir: vi.fn(), actions: <button type="button" aria-label="Editar treino">e</button> });

        const abrir = screen.getByRole('button', { name: /abrir treino/i });
        expect(abrir).not.toContainElement(screen.getByRole('button', { name: 'Editar treino' }));
    });

    it('justificativa da IA aparece com o texto completo no title', () => {
        renderCard({ porQue: 'Estímulo de limiar antes da prova.' });

        expect(screen.getByTestId('treino-justificativa')).toHaveAttribute('title', 'Estímulo de limiar antes da prova.');
    });

    it('marcadores de editado/adicionado e ícone de prova só quando pedidos', () => {
        const { rerender } = renderCard();
        expect(screen.queryByTestId('chip-editado-coach')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chip-adicionado-coach')).not.toBeInTheDocument();
        expect(screen.queryByTestId('icone-prova')).not.toBeInTheDocument();

        rerender(
            <TreinoPlanejadoCard dia="Ter 20/10" tipoTreino="PROVA" rotulo="Meia de SP" distanciaKm={21.1}
                editado adicionado isProva />,
        );
        expect(screen.getByRole('img', { name: 'Editado pelo treinador' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Adicionado pelo treinador' })).toBeInTheDocument();
        expect(screen.getByTestId('icone-prova')).toBeInTheDocument();
    });

    it('estado de execução aparece em texto, não só em cor', () => {
        renderCard({ estado: estadoDeExecucao('PERDIDO') });

        expect(screen.getByText('Perdido')).toBeInTheDocument();
    });

    it('rodapé só renderiza quando recebido', () => {
        renderCard({ rodape: <span>Sincronizado</span> });

        expect(screen.getByText('Sincronizado')).toBeInTheDocument();
    });
});

describe('estadoDeExecucao', () => {
    it.each([
        ['REALIZADO', 'Realizado', true],
        ['PERDIDO', 'Perdido', true],
        ['PENDENTE', 'Pendente', false],
        ['CANCELADO', 'Cancelado', false],
        [undefined, 'Pendente', false],
    ])('%s → "%s" (cor de destaque: %s)', (status, rotulo, comCor) => {
        const e = estadoDeExecucao(status);

        expect(e.rotulo).toBe(rotulo);
        expect(e.cor !== null).toBe(comCor);
    });

    describe('linha de intensidade (zonas do atleta)', () => {
        it('mostra Zn · pace · FC, nessa ordem, com o eixo primário em peso 600', () => {
            renderCard({
                intensidade: { zona: 'Z2', pace: '5:15–5:45', fc: '143–150 bpm', primario: 'FC', paceIndisponivel: false },
            });

            const linha = screen.getByTestId('linha-intensidade');
            expect(linha).toHaveTextContent('Z2');
            expect(linha.textContent).toMatch(/Z2.*5:15–5:45.*143–150 bpm/);
            expect(screen.getByText('143–150 bpm')).toHaveStyle({ fontWeight: 600 });
            expect(screen.getByText('5:15–5:45')).not.toHaveStyle({ fontWeight: 600 });
        });

        it('alvo personalizado não tem chip de zona', () => {
            renderCard({
                intensidade: { zona: null, pace: '5:20–5:40', primario: 'PACE', paceIndisponivel: false },
            });

            expect(screen.queryByTestId('chip-zona')).not.toBeInTheDocument();
            expect(screen.getByText('5:20–5:40')).toBeInTheDocument();
        });

        it('pace indisponível é dito, sem inventar número', () => {
            renderCard({
                intensidade: { zona: 'Z2', fc: '143–150 bpm', primario: 'FC', paceIndisponivel: true },
            });

            expect(screen.getByText(/pace indisponível/i)).toBeInTheDocument();
        });

        it('substitui a linha de zona em texto livre', () => {
            renderCard({
                zonaAlvo: 'Z2-Z3',
                intensidade: { zona: 'Z2', pace: '5:15–5:45', primario: 'PACE', paceIndisponivel: false },
            });

            expect(screen.queryByText('Z2-Z3')).not.toBeInTheDocument();
        });

        it('não usa lime (primary-500) na leitura', () => {
            renderCard({
                intensidade: { zona: 'Z2', pace: '5:15–5:45', fc: '143–150 bpm', primario: 'PACE', paceIndisponivel: false },
            });

            for (const valor of ['5:15–5:45', '143–150 bpm']) {
                expect(screen.getByText(valor)).not.toHaveStyle({ color: primary[500] });
            }
        });
    });
});
