import { render, screen } from '@testing-library/react';
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
    stats: [
        { label: 'Duração', value: '58 min', sub: 'plano 61 min' },
        { label: 'Esforço', value: '7/10', sub: 'esperado 6/10', valueColor: '#FBBF24' },
    ],
};

describe('WorkoutAnalysisCard', () => {
    it('done: reconhecimento, números e os três blocos na ordem do canvas', () => {
        render(<WorkoutAnalysisCard view={done} />);

        expect(screen.getByText('Análise do treino')).toBeInTheDocument();
        expect(screen.getByText('Você segurou o ritmo nos dois blocos.')).toBeInTheDocument();
        expect(screen.getByText('58 min')).toBeInTheDocument();
        expect(screen.getByText('plano 61 min')).toBeInTheDocument();

        const texto = screen.getByTestId('workout-analysis-card').textContent ?? '';
        const ordem = [
            'Você segurou o ritmo',
            'Duração',
            'Como foi',
            'O que o seu esforço diz',
            'Para o próximo treino',
            'Seu coach vê a mesma análise',
        ].map((t) => texto.indexOf(t));
        expect(ordem.every((i) => i >= 0)).toBe(true);
        expect([...ordem].sort((a, b) => a - b)).toEqual(ordem);
    });

    it('pending: "Analisando…" com os números e sem os blocos de texto', () => {
        render(
            <WorkoutAnalysisCard
                view={{ status: 'pending', stats: [{ label: 'Duração', value: '58 min' }] }}
            />,
        );

        expect(screen.getByText('Analisando o seu treino…')).toBeInTheDocument();
        expect(screen.getByText('58 min')).toBeInTheDocument();
        expect(screen.queryByText('Como foi')).not.toBeInTheDocument();
        expect(screen.queryByText(/Seu coach vê a mesma análise/)).not.toBeInTheDocument();
        expect(screen.getByText(/a análise fica guardada aqui no treino/)).toBeInTheDocument();
    });

    it('done sem reconhecimento: seções presentes sem o bloco de troféu', () => {
        render(<WorkoutAnalysisCard view={{ ...done, reconhecimento: undefined }} />);

        expect(screen.queryByText(/Você segurou o ritmo/)).not.toBeInTheDocument();
        expect(screen.getByText('Como foi')).toBeInTheDocument();
    });
});
