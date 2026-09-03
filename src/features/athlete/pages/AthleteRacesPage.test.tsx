import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import AthleteRacesPage from './AthleteRacesPage';
import { useAthleteRaces } from '../../../hooks/useAthleteRaces';
import type { Prova } from '../../../types/Prova';

const navigateMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router')>();
  return { ...mod, useNavigate: () => navigateMock };
});
vi.mock('../../../hooks/useAthleteRaces');

const HOJE = new Date(2026, 8, 2, 9);

const ALVO: Prova = {
  id: 'a', nomeProva: 'Maratona SP', dataProva: '2026-12-06', tipoProva: 'MARATONA', distancia: 'KM_42',
  provaAlvo: true, semanasPreparacao: 16, semanasFaltando: 13, preparacaoCurta: true, tempoObjetivo: '03:45:00',
};
const SECUNDARIA: Prova = {
  id: 'b', nomeProva: 'Trilha da Serra', dataProva: '2026-10-25', tipoProva: 'TRAIL', distancia: 'CUSTOMIZADA', distanciaKm: 30,
  provaAlvo: false, semanasPreparacao: 12, semanasFaltando: 7, preparacaoCurta: false,
};
const REALIZADA: Prova = {
  id: 'c', nomeProva: 'Meia do Rio', dataProva: '2026-06-14', tipoProva: 'MEIA', distancia: 'KM_21', foiRealizada: true, provaAlvo: false,
};

function mockHook(races: Prova[], extra: Partial<ReturnType<typeof useAthleteRaces>> = {}) {
  const value = {
    races, loading: false, saving: false, error: null,
    fetchRaces: vi.fn(), getRace: vi.fn(), createRace: vi.fn(), updateRace: vi.fn(), cancelRace: vi.fn().mockResolvedValue(undefined),
    ...extra,
  };
  vi.mocked(useAthleteRaces).mockReturnValue(value);
  return value;
}

function renderPage() {
  const router = createHashRouter([{ path: '/', element: <AthleteRacesPage /> }]);
  return render(<RouterProvider router={router} />);
}

describe('AthleteRacesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(HOJE);
  });
  afterEach(() => vi.useRealTimers());

  it('alvo em destaque com semanas e aviso; secundária com chips; realizada sem ações', () => {
    mockHook([REALIZADA, SECUNDARIA, ALVO]);
    renderPage();

    const cards = screen.getAllByTestId('race-card');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveAttribute('data-alvo', 'true');
    expect(cards[0]).toHaveTextContent('Maratona SP');
    expect(cards[0]).toHaveTextContent('faltam 13 semanas de 16 recomendadas');
    expect(within(cards[0]).getByText('Preparação curta')).toBeInTheDocument();

    const secundaria = cards.find((c) => c.textContent?.includes('Trilha da Serra'))!;
    expect(secundaria).toHaveTextContent('30 km · Trail');
    expect(within(secundaria).getByText('Planejada')).toBeInTheDocument();
    expect(within(secundaria).getByRole('button', { name: /editar/i })).toBeInTheDocument();

    const realizada = cards.find((c) => c.textContent?.includes('Meia do Rio'))!;
    expect(within(realizada).getByText('Realizada')).toBeInTheDocument();
    expect(within(realizada).queryByRole('button', { name: /editar|cancelar/i })).toBeNull();
  });

  it('estado vazio com CTA de cadastro', async () => {
    mockHook([]);
    renderPage();

    expect(screen.getByTestId('races-empty')).toHaveTextContent(/nenhuma prova cadastrada/i);
    await userEvent.click(screen.getByRole('button', { name: /cadastrar prova/i }));
    expect(navigateMock).toHaveBeenCalledWith('/athlete/races/new');
  });

  it('cancelar pede confirmação e chama o hook', async () => {
    const hook = mockHook([SECUNDARIA]);
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/Trilha da Serra sai do seu plano/);
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancelar prova/i }));

    expect(hook.cancelRace).toHaveBeenCalledWith('b');
  });

  it('editar navega para a rota de edição; voltar vai para o Plano', async () => {
    mockHook([SECUNDARIA]);
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(navigateMock).toHaveBeenCalledWith('/athlete/races/b/edit');
    await userEvent.click(screen.getByRole('button', { name: /voltar para o plano/i }));
    expect(navigateMock).toHaveBeenCalledWith('/athlete/plan');
  });

  it('erro de carga mostra alerta com tentar novamente', () => {
    mockHook([], { error: new Error('boom') });
    renderPage();
    expect(screen.getByText(/não foi possível carregar suas provas/i)).toBeInTheDocument();
  });
});
