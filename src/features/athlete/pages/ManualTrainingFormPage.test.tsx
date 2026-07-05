import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import ManualTrainingFormPage from './ManualTrainingFormPage';
import { useManualTraining } from '../../../hooks/useManualTraining';
import { useFitUpload } from '../../../hooks/useFitUpload';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';

const navigateMock = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../../hooks/useManualTraining');
vi.mock('../../../hooks/useFitUpload');

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

const TREINO_FIT: TreinoRealizadoDto = {
  id: 't-fit-1',
  dataTreino: '2026-07-01',
  tipoTreino: 'CONTINUO',
  duracaoMin: '00:30:00',
  distanciaKm: 5,
  fcMedia: 150,
  tssCalculado: 62,
  fonteDados: { value: 'MANUAL', label: 'Manual' },
  status: { value: 'REALIZADO', label: 'Realizado' },
  etapasRealizadas: [{}, {}],
};

function fitFile() {
  return new File(['dados'], 'treino.fit', { type: 'application/octet-stream' });
}

function mockUseFitUpload(overrides: Partial<ReturnType<typeof useFitUpload>> = {}) {
  vi.mocked(useFitUpload).mockReturnValue({
    upload: vi.fn().mockResolvedValue(TREINO_FIT),
    uploading: false,
    error: null,
    result: null,
    reset: vi.fn(),
    ...overrides,
  });
}

function renderPage() {
  return render(<MemoryRouter><ManualTrainingFormPage /></MemoryRouter>);
}

describe('ManualTrainingFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFitUpload();
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

  it('mostra a zona de upload de .fit acima do formulário manual', () => {
    renderPage();

    expect(screen.getByLabelText(/selecionar arquivo \.fit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar treino/i })).toBeInTheDocument();
  });

  it('ao importar um .fit com sucesso, mostra o FitUploadResultCard sem esconder o formulário manual', async () => {
    const upload = vi.fn().mockResolvedValue(TREINO_FIT);
    mockUseFitUpload({ upload });
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByLabelText(/selecionar arquivo \.fit/i).querySelector('input')!;
    await user.upload(input, fitFile());

    await waitFor(() => expect(screen.getByText('Treino importado com sucesso')).toBeInTheDocument());
    expect(upload).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /registrar treino/i })).toBeInTheDocument();
  });

  it('"Importar outro" volta a mostrar a zona de upload', async () => {
    const upload = vi.fn().mockResolvedValue(TREINO_FIT);
    const reset = vi.fn();
    mockUseFitUpload({ upload, reset });
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByLabelText(/selecionar arquivo \.fit/i).querySelector('input')!;
    await user.upload(input, fitFile());
    await screen.findByText('Treino importado com sucesso');

    await user.click(screen.getByRole('button', { name: /importar outro/i }));

    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByLabelText(/selecionar arquivo \.fit/i)).toBeInTheDocument();
  });

  it('mostra a mensagem de erro curada do backend (ex.: 422) ao importar um .fit inválido, sem afetar o formulário manual', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('Arquivo .fit inválido ou corrompido'));
    mockUseFitUpload({ upload });
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByLabelText(/selecionar arquivo \.fit/i).querySelector('input')!;
    await user.upload(input, fitFile());

    expect(await screen.findByText('Arquivo .fit inválido ou corrompido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar treino/i })).toBeInTheDocument();
  });

  it('usa uma mensagem genérica quando o erro não é uma instância de Error', async () => {
    const upload = vi.fn().mockRejectedValue('falha não padronizada');
    mockUseFitUpload({ upload });
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByLabelText(/selecionar arquivo \.fit/i).querySelector('input')!;
    await user.upload(input, fitFile());

    expect(await screen.findByText('Erro ao importar arquivo .fit.')).toBeInTheDocument();
  });
});
