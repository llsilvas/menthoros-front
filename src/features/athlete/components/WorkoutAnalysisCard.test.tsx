import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WorkoutAnalysisCard } from './WorkoutAnalysisCard';
import type { WorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';

const done: WorkoutAnalysisView = {
    status: 'done',
    reconhecimento: 'Você segurou o ritmo nos dois blocos.',
    comoFoi: 'Saiu como planejado.',
    esforco: 'Pesou um pouco mais que o esperado.',
    proximoTreino: 'Capriche no sono hoje.',
    rpeChipLabel: 'RPE 7/10 · Difícil',
    metrics: [
        { key: 'duracao', text: '58 min' },
        { key: 'distancia', text: '11,2 km' },
        { key: 'rpe', text: '7/10', color: '#FBBF24' },
    ],
    planLine: 'plano 61 min · 11,0 km · RPE esperado 6/10',
};

describe('WorkoutAnalysisCard', () => {
    it('done, fechado: métricas em uma linha, linha de plano e só o reconhecimento (resumo) visíveis', () => {
        render(<WorkoutAnalysisCard view={done} />);

        expect(screen.getByText('Análise do treino')).toBeInTheDocument();
        // Texto quebrado em spans (RPE com cor própria) — match pelo textContent agregado.
        expect(
            screen.getByText((_, el) => el?.textContent === '58 min · 11,2 km · 7/10' && el.tagName === 'P'),
        ).toBeInTheDocument();
        expect(screen.getByText('plano 61 min · 11,0 km · RPE esperado 6/10')).toBeInTheDocument();
        expect(screen.getByText('Você segurou o ritmo nos dois blocos.')).toBeInTheDocument();
        expect(screen.queryByText('Saiu como planejado.')).not.toBeInTheDocument();
        expect(screen.queryByText('Capriche no sono hoje.')).not.toBeInTheDocument();
        expect(screen.queryByText('Pesou um pouco mais que o esperado.')).not.toBeInTheDocument();
        expect(screen.getByText(/Seu coach vê a mesma análise/)).toBeInTheDocument();
    });

    it('done: resumo fica dentro do contêiner ai-highlight', () => {
        render(<WorkoutAnalysisCard view={done} />);

        const highlight = screen.getByTestId('ai-highlight');
        expect(highlight).toContainElement(screen.getByText('Você segurou o ritmo nos dois blocos.'));
    });

    it('embedded: sem o card/cabeçalho externo (data-testid card-header) — o rótulo "Análise do treino" migra para dentro do ai-highlight', () => {
        render(<WorkoutAnalysisCard view={done} embedded />);

        expect(screen.queryByTestId('card-header')).not.toBeInTheDocument();
        const highlight = screen.getByTestId('ai-highlight');
        expect(highlight).toContainElement(screen.getByText('Análise do treino'));
        expect(screen.getByText('Você segurou o ritmo nos dois blocos.')).toBeInTheDocument();
    });

    it('não-embedded (default): mantém o card/cabeçalho externo "Análise do treino", sem repeti-lo dentro do ai-highlight', () => {
        render(<WorkoutAnalysisCard view={done} />);

        expect(screen.getByTestId('card-header')).toBeInTheDocument();
        expect(screen.getAllByText('Análise do treino')).toHaveLength(1);
    });

    it('done: "Ver análise completa" revela comoFoi, proximoTreino e esforco (ocultos até o toque)', async () => {
        const user = userEvent.setup();
        render(<WorkoutAnalysisCard view={done} />);

        const toggle = screen.getByRole('button', { name: /ver análise completa/i });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Saiu como planejado.')).not.toBeInTheDocument();
        expect(screen.queryByText('Capriche no sono hoje.')).not.toBeInTheDocument();
        expect(screen.queryByText('Pesou um pouco mais que o esperado.')).not.toBeInTheDocument();

        await user.click(toggle);

        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Saiu como planejado.')).toBeInTheDocument();
        expect(screen.getByText('Capriche no sono hoje.')).toBeInTheDocument();
        expect(screen.getByText('Pesou um pouco mais que o esperado.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ver menos/i })).toBeInTheDocument();
    });

    it('sem plano diferente: linha de plano não é renderizada', () => {
        render(<WorkoutAnalysisCard view={{ ...done, planLine: undefined }} />);

        expect(screen.queryByText(/^plano /)).not.toBeInTheDocument();
    });

    it('pending: frase + skeleton, sem caixa aninhada, com as métricas', () => {
        render(
            <WorkoutAnalysisCard
                view={{ status: 'pending', metrics: [{ key: 'duracao', text: '58 min' }] }}
            />,
        );

        expect(screen.getByText(/Analisando o seu treino/)).toBeInTheDocument();
        expect(screen.getByText('58 min')).toBeInTheDocument();
        expect(screen.queryByTestId('ai-highlight')).not.toBeInTheDocument();
        expect(screen.queryByText(/Seu coach vê a mesma análise/)).not.toBeInTheDocument();
    });

    it('done sem reconhecimento: o botão continua oferecendo os demais textos ao expandir', async () => {
        const user = userEvent.setup();
        render(<WorkoutAnalysisCard view={{ ...done, reconhecimento: undefined }} />);

        expect(screen.queryByText(/Você segurou o ritmo/)).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /ver análise completa/i }));
        expect(screen.getByText('Saiu como planejado.')).toBeInTheDocument();
    });
});
