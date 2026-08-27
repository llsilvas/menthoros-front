import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import AthleteWorkoutPage from './AthleteWorkoutPage';
import { useTodayWorkout } from '../hooks/useTodayWorkout';
import type { TreinoHoje } from '../../../types/AthleteWorkoutToday';

const navigateMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router')>();
  return { ...mod, useNavigate: () => navigateMock };
});
vi.mock('../hooks/useTodayWorkout');

const fetchTreino = vi.fn();
const pular = vi.fn();

const TREINO: TreinoHoje = {
  hoje: '2026-08-27',
  id: 't1',
  tipoTreino: 'INTERVALADO',
  descricao: '2x(4/2)',
  duracaoMin: 45,
  zonaAlvo: 'Z4',
  statusTreino: 'PENDENTE',
  etapas: [
    { ordem: 1, tipoEtapa: 'AQUECIMENTO', descricao: 'Trote', duracaoMin: 10, alvoPrimario: 'NENHUM' },
    { ordem: 2, tipoEtapa: 'INTERVALADO', descricao: 'Tiro', duracaoMin: 4, alvoPrimario: 'FC', fcAlvoMin: 145, fcAlvoMax: 151, textoSecundario: '4:30-4:45' },
    { ordem: 3, tipoEtapa: 'RECUPERACAO', descricao: 'Trote leve', duracaoMin: 2, alvoPrimario: 'PACE', paceAlvo: '6:00' },
  ],
};

function mock(extra: Partial<ReturnType<typeof useTodayWorkout>> = {}) {
  vi.mocked(useTodayWorkout).mockReturnValue({
    treino: TREINO, loading: false, error: null, fetchTreino, pular, pulando: false, pularError: null,
    ...extra,
  });
}

function renderPage() {
  const router = createHashRouter([{ path: '/', element: <AthleteWorkoutPage /> }]);
  return render(<RouterProvider router={router} />);
}

describe('AthleteWorkoutPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('busca o treino de hoje ao montar', () => {
    mock();
    renderPage();
    expect(fetchTreino).toHaveBeenCalled();
  });

  it('mostra o perfil, as etapas com alvo e o botão "Concluí o treino" sem scroll (até 4 etapas)', () => {
    mock();
    renderPage();
    expect(screen.getByTestId('workout-profile')).toBeInTheDocument();
    const etapas = screen.getAllByTestId('workout-today-etapa');
    expect(etapas).toHaveLength(3);
    expect(within(etapas[1]).getByText(/145–151 bpm/)).toBeInTheDocument();
    expect(within(etapas[1]).getByText(/4:30-4:45/)).toBeInTheDocument();
    expect(within(etapas[2]).getByText(/6:00 \/km/)).toBeInTheDocument();
    const acoes = screen.getByTestId('workout-today-actions');
    expect(getComputedStyle(acoes).position).toBe('sticky');
    expect(screen.getByRole('button', { name: /concluí o treino/i })).toBeInTheDocument();
  });

  it('"Concluí o treino" navega para o registro pré-preenchido com tipo e duração planejada', async () => {
    mock();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /concluí o treino/i }));
    expect(navigateMock).toHaveBeenCalledWith('/athlete/training/log', {
      state: { tipo: 'INTERVALADO', duracaoMinutos: 45 },
    });
  });

  it('"Não vou conseguir hoje" abre confirmação com motivo opcional e pula', async () => {
    mock();
    pular.mockResolvedValue({ ...TREINO, statusTreino: 'PERDIDO', motivoPulo: 'DOR' });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /não vou conseguir hoje/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('radio', { name: /^dor$/i }));
    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }));

    expect(pular).toHaveBeenCalledWith('DOR');
  });

  it('pular sem escolher motivo chama a ação sem argumento', async () => {
    mock();
    pular.mockResolvedValue({ ...TREINO, statusTreino: 'PERDIDO' });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /não vou conseguir hoje/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }));

    expect(pular).toHaveBeenCalledWith(undefined);
  });

  it('treino já pulado: estado de pulo, sem etapas nem "Concluí o treino"', () => {
    mock({ treino: { ...TREINO, statusTreino: 'PERDIDO', motivoPulo: 'DOR' } });
    renderPage();
    expect(screen.getByText(/você pulou hoje/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /concluí o treino/i })).toBeNull();
    expect(screen.getByRole('button', { name: /registrar mesmo assim/i })).toBeInTheDocument();
  });

  it('sem treino planejado hoje: estado vazio', () => {
    mock({ treino: null });
    renderPage();
    expect(screen.getByText(/nenhum treino planejado para hoje/i)).toBeInTheDocument();
  });

  it('estado de erro com retry', () => {
    mock({ treino: null, error: new Error('boom') });
    renderPage();
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('spinner enquanto carrega sem dado', () => {
    mock({ treino: null, loading: true });
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
