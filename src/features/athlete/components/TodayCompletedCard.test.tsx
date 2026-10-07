import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('sem analysisView, não mostra o card de análise', () => {
    render(<TodayCompletedCard realizado={REALIZADO} />);
    expect(screen.queryByTestId('workout-analysis-card')).toBeNull();
  });

  it('sem analysisView, mostra o subtítulo de duração/RPE', () => {
    render(<TodayCompletedCard realizado={REALIZADO} />);
    expect(screen.getByText(/40 min · RPE 6\/10/)).toBeInTheDocument();
  });

  it('com analysisView, mostra o card de análise dentro do card do treino e omite o subtítulo (sem duplicar com a linha de métricas do card)', () => {
    render(
      <TodayCompletedCard
        realizado={REALIZADO}
        analysisView={{ status: 'done', reconhecimento: 'Bom treino.', comoFoi: 'Saiu como planejado.', metrics: [], verdict: null }}
      />,
    );
    expect(screen.getByTestId('workout-analysis-card')).toBeInTheDocument();
    expect(screen.getByText('Bom treino.')).toBeInTheDocument();
    expect(screen.queryByText(/40 min · RPE 6\/10/)).not.toBeInTheDocument();
  });

  it('com veredito, mostra o chip na linha de "Treino feito"', () => {
    render(
      <TodayCompletedCard
        realizado={REALIZADO}
        analysisView={{
          status: 'pending',
          metrics: [],
          verdict: { label: 'Dentro do plano', tone: 'success' },
        }}
      />,
    );
    expect(screen.getByTestId('workout-verdict-chip')).toHaveTextContent('Dentro do plano');
  });

  it('sem veredito, não mostra o chip', () => {
    render(
      <TodayCompletedCard
        realizado={REALIZADO}
        analysisView={{ status: 'pending', metrics: [], verdict: null }}
      />,
    );
    expect(screen.queryByTestId('workout-verdict-chip')).toBeNull();
  });
});
