import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import ManualTrainingFormPage from './ManualTrainingFormPage';
import { useManualTraining } from '../../../hooks/useManualTraining';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';

const navigateMock = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../../hooks/useManualTraining');

const TREINO_SALVO: TreinoRealizadoDto = {
  id: 't1',
  dataTreino: '2026-07-04',
  tipoTreino: 'CONTINUO',
  duracaoMin: '01:00:00',
  distanciaKm: 10,
  percepcaoEsforco: 6,
  tssCalculado: 62,
  fonteDados: { value: 'MANUAL', label: 'Manual' },
  status: { value: 'CONCLUIDO', label: 'Concluído' },
};

function renderPage() {
  return render(<MemoryRouter><ManualTrainingFormPage /></MemoryRouter>);
}

describe('ManualTrainingFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra o PostWorkoutFeedbackCard após registrar com sucesso, em vez do toast', async () => {
    const registrar = vi.fn().mockResolvedValue(TREINO_SALVO);
    vi.mocked(useManualTraining).mockReturnValue({
      recentes: [], isFetching: false, isSubmitting: false, fetchError: null,
      registrar, fetchRecentes: vi.fn(),
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /registrar treino/i }));

    await waitFor(() => expect(screen.getByText('🏃 Corrida contínua')).toBeInTheDocument());
    expect(screen.queryByText('Treino registrado com sucesso!')).toBeNull();
  });

  it('"Voltar para Home" navega para a Home do atleta', async () => {
    const registrar = vi.fn().mockResolvedValue(TREINO_SALVO);
    vi.mocked(useManualTraining).mockReturnValue({
      recentes: [], isFetching: false, isSubmitting: false, fetchError: null,
      registrar, fetchRecentes: vi.fn(),
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /registrar treino/i }));
    await screen.findByText('🏃 Corrida contínua');
    await user.click(screen.getByRole('button', { name: /voltar para home/i }));

    expect(navigateMock).toHaveBeenCalledWith('/athlete/home');
  });

  it('mantém o toast de erro quando o registro falha (comportamento existente preservado)', async () => {
    const registrar = vi.fn().mockRejectedValue(new Error('boom'));
    vi.mocked(useManualTraining).mockReturnValue({
      recentes: [], isFetching: false, isSubmitting: false, fetchError: null,
      registrar, fetchRecentes: vi.fn(),
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /registrar treino/i }));

    expect(await screen.findByText(/erro ao registrar treino/i)).toBeInTheDocument();
    expect(screen.queryByText('🏃 Corrida contínua')).toBeNull();
  });
});
