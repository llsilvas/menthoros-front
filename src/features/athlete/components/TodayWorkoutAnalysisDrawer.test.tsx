import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TodayWorkoutAnalysisDrawer } from './TodayWorkoutAnalysisDrawer';
import type { WorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';

const pendingView: WorkoutAnalysisView = { status: 'pending', stats: [] };

const doneView: WorkoutAnalysisView = {
  status: 'done',
  comoFoi: 'Saiu como planejado.',
  stats: [],
};

describe('TodayWorkoutAnalysisDrawer', () => {
  it('view pending: mostra "Analisando…"', () => {
    render(<TodayWorkoutAnalysisDrawer view={pendingView} open onClose={vi.fn()} />);

    expect(screen.getByTestId('workout-analysis-card')).toBeInTheDocument();
    expect(screen.getByText('Analisando o seu treino…')).toBeInTheDocument();
  });

  it('view done: mostra o card completo', () => {
    render(<TodayWorkoutAnalysisDrawer view={doneView} open onClose={vi.fn()} />);

    expect(screen.getByTestId('workout-analysis-card')).toBeInTheDocument();
    expect(screen.getByText('Saiu como planejado.')).toBeInTheDocument();
  });

  it('view null: mensagem curta, sem quebrar', () => {
    render(<TodayWorkoutAnalysisDrawer view={null} open onClose={vi.fn()} />);

    expect(screen.queryByTestId('workout-analysis-card')).toBeNull();
    expect(screen.getByText(/não foi possível carregar a análise/i)).toBeInTheDocument();
  });

  it('chama onClose ao clicar em "Fechar"', async () => {
    const onClose = vi.fn();
    render(<TodayWorkoutAnalysisDrawer view={doneView} open onClose={onClose} />);

    screen.getByRole('button', { name: /fechar/i }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });
});
