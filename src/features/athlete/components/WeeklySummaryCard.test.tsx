import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklySummaryCard } from './WeeklySummaryCard';
import type { WeeklySummary } from '../adapters/buildWeeklySummary';

function resumo(overrides: Partial<WeeklySummary> = {}): WeeklySummary {
  return {
    totalTreinos: 3, volumeTotalKm: 25.5, streak: 4, formaAtual: 'Forma ideal', proximoTreino: 'INTERVALADO',
    ...overrides,
  };
}

describe('WeeklySummaryCard', () => {
  it('renderiza treinos, volume, streak, forma e próximo treino', () => {
    render(<WeeklySummaryCard resumo={resumo()} />);

    expect(screen.getByText('Seu resumo da semana')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('25.5 km')).toBeInTheDocument();
    expect(screen.getByText('4 semanas')).toBeInTheDocument();
    expect(screen.getByText('Forma ideal')).toBeInTheDocument();
    expect(screen.getByText('INTERVALADO')).toBeInTheDocument();
  });

  it('mostra estado vazio honesto quando não há treinos na semana (não fabrica "0 treinos, 0 km")', () => {
    render(<WeeklySummaryCard resumo={resumo({ totalTreinos: 0, volumeTotalKm: 0 })} />);

    expect(screen.getByText(/você ainda não registrou treinos esta semana/i)).toBeInTheDocument();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('omite o próximo treino quando ausente', () => {
    render(<WeeklySummaryCard resumo={resumo({ proximoTreino: null })} />);
    expect(screen.queryByText('Próximo')).toBeNull();
  });

  it('singular "semana" quando streak é 1', () => {
    render(<WeeklySummaryCard resumo={resumo({ streak: 1 })} />);
    expect(screen.getByText('1 semana')).toBeInTheDocument();
  });
});
