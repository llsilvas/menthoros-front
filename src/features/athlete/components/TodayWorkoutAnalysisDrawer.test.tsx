import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TodayWorkoutAnalysisDrawer } from './TodayWorkoutAnalysisDrawer';
import { useAthleteWorkoutAnalysis } from '../hooks/useAthleteWorkoutAnalysis';
import type { AthleteWorkoutAnalysis } from '../../../types/AthleteWorkoutAnalysis';

vi.mock('../hooks/useAthleteWorkoutAnalysis', () => ({
  useAthleteWorkoutAnalysis: vi.fn(),
}));

const useAnalysis = vi.mocked(useAthleteWorkoutAnalysis);

const completa: AthleteWorkoutAnalysis = {
  status: 'COMPLETED',
  reconhecimento: 'Você segurou o ritmo.',
  comoFoi: 'Saiu como planejado.',
  esforco: 'Pesou um pouco mais que o esperado.',
  proximoTreino: 'Capriche no sono hoje.',
  executado: { duracaoMin: 30, rpe: 6 },
};

const pendente: AthleteWorkoutAnalysis = { status: 'PENDING', executado: {} };

describe('TodayWorkoutAnalysisDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fechado: não aciona o hook (id desligado)', () => {
    useAnalysis.mockReturnValue({ analysis: null, status: 'idle', error: null, loading: false });

    render(<TodayWorkoutAnalysisDrawer realizadoId="r1" open={false} onClose={vi.fn()} />);

    expect(useAnalysis).toHaveBeenCalledWith(null);
  });

  it('aberto, análise pending: mostra "Analisando…"', () => {
    useAnalysis.mockReturnValue({ analysis: pendente, status: 'pending', error: null, loading: false });

    render(<TodayWorkoutAnalysisDrawer realizadoId="r1" open onClose={vi.fn()} />);

    expect(useAnalysis).toHaveBeenCalledWith('r1');
    expect(screen.getByTestId('workout-analysis-card')).toBeInTheDocument();
    expect(screen.getByText('Analisando o seu treino…')).toBeInTheDocument();
  });

  it('aberto, análise done: mostra o card completo', () => {
    useAnalysis.mockReturnValue({ analysis: completa, status: 'done', error: null, loading: false });

    render(<TodayWorkoutAnalysisDrawer realizadoId="r1" open onClose={vi.fn()} />);

    expect(screen.getByTestId('workout-analysis-card')).toBeInTheDocument();
    expect(screen.getByText('Saiu como planejado.')).toBeInTheDocument();
  });

  it('aberto, análise empty (204): mensagem curta, sem quebrar', () => {
    useAnalysis.mockReturnValue({ analysis: null, status: 'empty', error: null, loading: false });

    render(<TodayWorkoutAnalysisDrawer realizadoId="r1" open onClose={vi.fn()} />);

    expect(screen.queryByTestId('workout-analysis-card')).toBeNull();
    expect(screen.getByText('Este treino não tem análise disponível.')).toBeInTheDocument();
  });

  it('aberto, erro: mensagem curta, sem quebrar', () => {
    useAnalysis.mockReturnValue({ analysis: null, status: 'error', error: new Error('boom'), loading: false });

    render(<TodayWorkoutAnalysisDrawer realizadoId="r1" open onClose={vi.fn()} />);

    expect(screen.queryByTestId('workout-analysis-card')).toBeNull();
    expect(screen.getByText(/não foi possível carregar a análise/i)).toBeInTheDocument();
  });
});
