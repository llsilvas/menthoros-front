import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AthleteShareWorkoutPage from './AthleteShareWorkoutPage';
import { useShareWorkout } from '../hooks/useShareWorkout';
import type { ShareCardData } from '../types/ShareCard';

// jsdom não rasteriza; a geração da imagem tem teste próprio (useShareImage.test.ts).
vi.mock('html-to-image', () => ({ toBlob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })) }));

vi.mock('../hooks/useShareWorkout');

const fetchData = vi.fn();

function estado(over: Partial<ReturnType<typeof useShareWorkout>>) {
  vi.mocked(useShareWorkout).mockReturnValue({
    data: null, loading: false, error: null, notFound: false, fetchData, ...over,
  });
}

let router: ReturnType<typeof createHashRouter> | null = null;

function renderEm(treinoId = 'r1') {
  // replaceState não dispara popstate/hashchange: atribuir `location.hash` faria os routers de
  // testes anteriores navegarem, e o jsdom quebra no AbortSignal do request do loader.
  window.history.replaceState(null, '', `#/athlete/share/${treinoId}`);
  router = createHashRouter([{ path: '/athlete/share/:treinoId', element: <AthleteShareWorkoutPage /> }]);
  render(<RouterProvider router={router} />);
}

afterEach(() => {
  router?.dispose();
  router = null;
});

const DATA: ShareCardData = {
  availableModels: ['semana'],
  signature: null,
  plano: null,
  parciais: null,
  rota: null,
  semana: { rangeLabel: '3–9 de nov', totalKm: 10, dias: [], treinos: 1, tempoTotal: '50 min', attribution: null },
};

describe('AthleteShareWorkoutPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('carregando → skeleton (CA8)', () => {
    estado({ loading: true });
    renderEm();
    expect(screen.getByLabelText('Carregando o treino')).toBeInTheDocument();
  });

  it('erro → mensagem e "Tentar de novo" refaz a busca (CA8)', async () => {
    estado({ error: new Error('x') });
    renderEm();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(fetchData).toHaveBeenCalledTimes(2); // efeito de montagem + clique
  });

  it('não encontrado → texto e link para o início no formato do hash router (CA8)', () => {
    estado({ notFound: true });
    renderEm();
    expect(screen.getByText('Treino não encontrado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '#/athlete/home');
  });

  it('com dados → conteúdo de compartilhar, passando o treinoId da URL ao hook', () => {
    estado({ data: DATA });
    renderEm('abc');
    expect(useShareWorkout).toHaveBeenCalledWith('abc');
    expect(screen.getByRole('radiogroup', { name: 'Modelo' })).toBeInTheDocument();
  });
});
