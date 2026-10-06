import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkoutAnalysisTeaser } from './WorkoutAnalysisTeaser';
import type { WorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';

describe('WorkoutAnalysisTeaser', () => {
  it('pending: mostra "Analisando o seu treino…"', () => {
    const view: WorkoutAnalysisView = { status: 'pending', stats: [] };
    render(<WorkoutAnalysisTeaser view={view} onClick={vi.fn()} />);

    expect(screen.getByText('Analisando o seu treino…')).toBeInTheDocument();
  });

  it('done com reconhecimento: mostra o texto como prévia', () => {
    const view: WorkoutAnalysisView = { status: 'done', reconhecimento: 'Você segurou o ritmo.', stats: [] };
    render(<WorkoutAnalysisTeaser view={view} onClick={vi.fn()} />);

    expect(screen.getByText('Você segurou o ritmo.')).toBeInTheDocument();
  });

  it('done sem reconhecimento: cai para comoFoi', () => {
    const view: WorkoutAnalysisView = { status: 'done', comoFoi: 'Saiu como planejado.', stats: [] };
    render(<WorkoutAnalysisTeaser view={view} onClick={vi.fn()} />);

    expect(screen.getByText('Saiu como planejado.')).toBeInTheDocument();
  });

  it('done sem nenhum texto: não renderiza nada (sem clique morto)', () => {
    const view: WorkoutAnalysisView = { status: 'done', stats: [] };
    const { container } = render(<WorkoutAnalysisTeaser view={view} onClick={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('dispara onClick ao clicar', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const view: WorkoutAnalysisView = { status: 'done', comoFoi: 'Saiu como planejado.', stats: [] };
    render(<WorkoutAnalysisTeaser view={view} onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: /ver análise do treino/i }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('dispara onClick com Enter (teclado)', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const view: WorkoutAnalysisView = { status: 'done', comoFoi: 'Saiu como planejado.', stats: [] };
    render(<WorkoutAnalysisTeaser view={view} onClick={onClick} />);

    screen.getByRole('button', { name: /ver análise do treino/i }).focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledOnce();
  });
});
