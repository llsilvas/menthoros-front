import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReadinessCard } from './ReadinessCard';

describe('ReadinessCard (linha)', () => {
  it('mostra score, rótulo, recomendação e a origem quando há check-in hoje', () => {
    render(<ReadinessCard score={78} recommendation="Mantenha o plano." comCheckinHoje />);
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText(/prontidão alta/i)).toBeInTheDocument();
    expect(screen.getByText('Mantenha o plano.')).toBeInTheDocument();
    expect(screen.getByText(/com base no seu check-in/i)).toBeInTheDocument();
  });

  it('sem check-in hoje: não afirma origem', () => {
    render(<ReadinessCard score={40} />);
    expect(screen.getByText(/prontidão moderada/i)).toBeInTheDocument();
    expect(screen.queryByText(/com base no seu check-in/i)).toBeNull();
  });

  it('classifica: ≥90 ótima, ≥70 alta, ≥40 moderada, <40 baixa', () => {
    const { rerender } = render(<ReadinessCard score={95} />);
    expect(screen.getByText(/prontidão ótima/i)).toBeInTheDocument();
    rerender(<ReadinessCard score={20} />);
    expect(screen.getByText(/prontidão baixa/i)).toBeInTheDocument();
  });
});
