import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import AthleteRaceFormPage from './AthleteRaceFormPage';
import { useAthleteRaces } from '../../../hooks/useAthleteRaces';
import { ApiError } from '../../../api/core/ApiError';
import type { Prova } from '../../../types/Prova';

const navigateMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router')>();
  return { ...mod, useNavigate: () => navigateMock };
});
vi.mock('../../../hooks/useAthleteRaces');

const HOJE = new Date(2026, 8, 2, 9);
const ALVO: Prova = { id: 'a', nomeProva: 'Meia do Rio', dataProva: '2026-12-06', tipoProva: 'MEIA', distancia: 'KM_21', provaAlvo: true };
const OUTRA: Prova = { id: 'b', nomeProva: 'Trilha', dataProva: '2026-10-25', tipoProva: 'TRAIL', distancia: 'KM_10', provaAlvo: false, tempoObjetivo: '01:00:00' };

function mockHook(races: Prova[], extra: Partial<ReturnType<typeof useAthleteRaces>> = {}) {
  const value = {
    races, loading: false, saving: false, error: null,
    fetchRaces: vi.fn(), getRace: vi.fn(),
    createRace: vi.fn().mockResolvedValue(ALVO), updateRace: vi.fn().mockResolvedValue(OUTRA), cancelRace: vi.fn(),
    ...extra,
  };
  vi.mocked(useAthleteRaces).mockReturnValue(value);
  return value;
}

// Sem links internos nesta página: o router em memória basta (a navegação é via `useNavigate`, mockado).
function renderPage(path: string) {
  const router = createMemoryRouter([
    { path: '/athlete/races/new', element: <AthleteRaceFormPage /> },
    { path: '/athlete/races/:provaId/edit', element: <AthleteRaceFormPage /> },
  ], { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('AthleteRaceFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(HOJE);
  });
  afterEach(() => vi.useRealTimers());

  it('cadastro: envia o subconjunto do atleta e volta para Minhas provas; alvo existente gera o aviso', async () => {
    const hook = mockHook([ALVO]);
    renderPage('/athlete/races/new');

    expect(await screen.findByRole('heading', { name: /cadastrar prova/i })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/nome da prova/i), 'Maratona SP');
    fireEvent.change(screen.getByTestId('race-date'), { target: { value: '2027-04-11' } });
    await userEvent.click(screen.getByRole('radio', { name: '42 km' }));
    await userEvent.click(screen.getByLabelText(/prova-alvo/i));
    expect(screen.getByTestId('race-target-warning')).toHaveTextContent('Substitui Meia do Rio');

    await userEvent.click(screen.getByRole('button', { name: /cadastrar prova/i }));

    await waitFor(() => expect(hook.createRace).toHaveBeenCalledWith({
      nomeProva: 'Maratona SP', dataProva: '2027-04-11', tipoProva: 'MARATONA', distancia: 'KM_42',
      distanciaKm: undefined, tempoObjetivo: undefined, provaAlvo: true,
    }));
    expect(navigateMock).toHaveBeenCalledWith('/athlete/races');
  });

  it('edição: pré-preenche a prova e salva pelo updateRace', async () => {
    const hook = mockHook([ALVO, OUTRA]);
    renderPage('/athlete/races/b/edit');

    expect(await screen.findByRole('heading', { name: /editar prova/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome da prova/i)).toHaveValue('Trilha');
    expect(screen.getByRole('radio', { name: '10 km' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Trail' })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(hook.updateRace).toHaveBeenCalledWith('b', expect.objectContaining({ nomeProva: 'Trilha', tipoProva: 'TRAIL', tempoObjetivo: '01:00:00' })));
  });

  it('409 ao salvar mostra que a prova já foi realizada', async () => {
    mockHook([OUTRA], { updateRace: vi.fn().mockRejectedValue(new ApiError({ method: 'PUT', url: '/x' }, { url: '/x', ok: false, status: 409, statusText: 'Conflict', body: {} }, 'conflito')) });
    renderPage('/athlete/races/b/edit');

    await userEvent.click(await screen.findByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/já foi realizada/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalledWith('/athlete/races');
  });

  it('edição de prova inexistente avisa', async () => {
    mockHook([ALVO]);
    renderPage('/athlete/races/zzz/edit');

    expect(await screen.findByText(/prova não encontrada/i)).toBeInTheDocument();
  });
});
