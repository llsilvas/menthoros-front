import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodayCompletedCard } from './TodayCompletedCard';
import type { AthleteRealizadoHoje } from '../../../types/AthleteHome';

const REALIZADO: AthleteRealizadoHoje = {
  id: 'r1', fonteDados: 'MANUAL', tipoTreino: 'FACIL', duracaoMin: 40, percepcaoEsforco: 6,
  feedbackRegistradoEm: '2026-08-27T19:00:00',
};

describe('TodayCompletedCard', () => {
  it('mostra o resumo do feito e o RPE', () => {
    render(<TodayCompletedCard realizado={REALIZADO} sensacoes={['PERNAS_PESADAS']} comentario="Difícil" />);
    expect(screen.getByText(/corrida fácil/i)).toBeInTheDocument();
    expect(screen.getByText(/6\/10/)).toBeInTheDocument();
    expect(screen.getByText(/pernas pesadas/i)).toBeInTheDocument();
    expect(screen.getByText('Difícil')).toBeInTheDocument();
  });

  it('sem sensações nem comentário: não inventa nada', () => {
    render(<TodayCompletedCard realizado={REALIZADO} sensacoes={[]} />);
    expect(screen.queryByText(/pernas pesadas/i)).toBeNull();
  });

  it('sem onClick, não é um botão (card estático)', () => {
    render(<TodayCompletedCard realizado={REALIZADO} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('com onClick, vira um botão acessível e dispara ao clicar', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<TodayCompletedCard realizado={REALIZADO} onClick={onClick} />);

    const botao = screen.getByRole('button', { name: /ver análise do treino/i });
    await user.click(botao);

    expect(onClick).toHaveBeenCalledOnce();
  });
});
