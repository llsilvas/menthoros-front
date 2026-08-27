import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentTrainingsPanel } from './RecentTrainingsPanel';
import type { RealizadoRecenteDto } from '../../../types/AtletaPerfilCoach';

const COM_FEEDBACK: RealizadoRecenteDto = {
  id: 'r1', dataTreino: '2026-08-27', tipoTreino: 'FACIL', fonteDados: 'INTERVALS_ICU',
  duracaoMin: 40, percepcaoEsforco: 6, sensacoes: ['PERNAS_PESADAS'], feedbackAtleta: 'Cansado',
  feedbackRegistradoEm: '2026-08-27T19:00:00',
};

const SEM_FEEDBACK: RealizadoRecenteDto = {
  id: 'r2', dataTreino: '2026-08-26', tipoTreino: 'INTERVALADO', fonteDados: 'MANUAL', duracaoMin: 50,
};

describe('RecentTrainingsPanel', () => {
  it('estado vazio quando não há realizados', () => {
    render(<RecentTrainingsPanel realizados={[]} />);
    expect(screen.getByText(/nenhum treino/i)).toBeInTheDocument();
  });

  it('mostra o feedback quando carimbado', () => {
    render(<RecentTrainingsPanel realizados={[COM_FEEDBACK]} />);
    expect(screen.getByText(/rpe 6/i)).toBeInTheDocument();
    expect(screen.getByText(/pernas pesadas/i)).toBeInTheDocument();
    expect(screen.getByText('Cansado')).toBeInTheDocument();
  });

  it('sem carimbo: não mostra feedback como se estivesse completo', () => {
    render(<RecentTrainingsPanel realizados={[SEM_FEEDBACK]} />);
    expect(screen.queryByText(/rpe/i)).toBeNull();
  });
});
