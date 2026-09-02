import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import AthletePlanPage from './AthletePlanPage';
import { useAthletePlan } from '../../../hooks/useAthletePlan';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';

const navigateMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router')>();
  return { ...mod, useNavigate: () => navigateMock };
});
vi.mock('../../../hooks/useAthletePlan');
vi.mock('../../../hooks/useAthleteProvas');

// Router real (não MemoryRouter): o `WorkoutDetailDrawer` passou a ter um `Link` de
// `react-router` para o modo treino — precisa de contexto de rota mesmo fora do App.
function renderPage() {
  const router = createHashRouter([{ path: '/', element: <AthletePlanPage /> }]);
  return render(<RouterProvider router={router} />);
}

const noop = vi.fn();
const HOJE = new Date(2026, 6, 1, 9, 0, 0); // quarta, 1 de julho

const PLANO: PlanoSemanal = {
  id: 'p1', atletaId: 'a1', semanaInicio: '2026-06-29', semanaFim: '2026-07-05',
  volumePlanejadoKm: 40, volumeRealizadoKm: 22, volumeAlvoKm: 45, status: 'ATIVO',
  objetivoSemanal: 'Semana de construção',
  treinosPlanejados: [
    { tipoTreino: 'FACIL', distanciaKm: 8, dataTreino: '2026-06-29', descricao: 'Trote leve',
      duracaoMin: '00:45:00', statusTreino: 'REALIZADO', diaSemana: 'SEGUNDA' },
    { tipoTreino: 'INTERVALADO', distanciaKm: 10, dataTreino: '2026-07-01', descricao: '6x1km',
      tssPlanejado: 90, duracaoMin: '01:05:00', statusTreino: 'PENDENTE', diaSemana: 'QUARTA',
      etapas: [
        { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10, descricaoEtapa: 'Trote' },
        { ordem: 2, tipoEtapa: 'ESFORCO', duracaoMin: 4, blocoId: 'b1', blocoRepeticoes: 2 },
        { ordem: 3, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
        { ordem: 4, tipoEtapa: 'ESFORCO', duracaoMin: 4, blocoId: 'b1', blocoRepeticoes: 2 },
        { ordem: 5, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
      ] },
    { tipoTreino: 'LONGO', distanciaKm: 16, dataTreino: '2026-07-04', descricao: 'Longo em Z2',
      duracaoMin: '01:30:00', statusTreino: 'PENDENTE', diaSemana: 'SABADO' },
  ],
};

function mock(plano: PlanoSemanal | null, extra: Partial<ReturnType<typeof useAthletePlan>> = {}) {
  vi.mocked(useAthletePlan).mockReturnValue({ plano, loading: false, error: null, fetchPlano: noop, ...extra });
}

describe('AthletePlanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(HOJE);
    vi.mocked(useAthleteProvas).mockReturnValue({ provas: [], loading: false, error: null, fetchProvas: noop });
  });
  afterEach(() => vi.useRealTimers());

  it('sete linhas, volume em km com uma casa, rodapé neutro, sem TSS e sem juízo', () => {
    mock(PLANO);
    renderPage();
    expect(screen.getAllByTestId('week-agenda-row')).toHaveLength(7);
    const volume = screen.getByTestId('plan-volume');
    expect(volume).toHaveTextContent('22,0');
    expect(volume).toHaveTextContent('/ 40 km');
    expect(volume).toHaveTextContent('Dia 3 de 7');
    expect(volume).toHaveTextContent('1 de 3 treinos feitos');
    expect(screen.getByText(/Semana de construção/)).toBeInTheDocument();
    expect(screen.queryByText(/TSS/)).toBeNull();
    expect(screen.queryByText(/semana leve|abaixo do planejado|ótima execução/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /anterior|próxima semana/i })).toBeNull();
  });

  it('hoje começa expandido (treino com etapas abre o detalhe, não a expansão inline)', async () => {
    mock(PLANO);
    renderPage();
    const hoje = screen.getAllByTestId('week-agenda-row').find((r) => r.dataset.today === 'true')!;
    expect(hoje).toHaveTextContent(/intervalado/i);
    // Linha com etapas: o toque abre o drawer com o perfil do treino e a série 2×.
    expect(within(hoje).getByRole('button')).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(within(hoje).getByRole('button'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByTestId('workout-profile')).toBeInTheDocument();
    expect(within(dialog).getAllByTestId('workout-block').length).toBeGreaterThanOrEqual(5);
    expect(within(dialog).getByTestId('repeat-bracket')).toHaveTextContent('2×');
    expect(within(dialog).getByRole('link', { name: /ver etapas e começar/i })).toHaveAttribute('href', '#/athlete/workout/today');
    await userEvent.click(within(dialog).getByRole('button', { name: /registrar treino/i }));
    expect(navigateMock).toHaveBeenCalledWith('/athlete/training/log');
  });

  it('linha sem etapas expande e colapsa (aria-expanded) e mostra a descrição', async () => {
    mock(PLANO);
    renderPage();
    const sabado = screen.getAllByTestId('week-agenda-row').find((r) => r.textContent?.includes('Longo'))!;
    const botao = within(sabado).getByRole('button');
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(within(sabado).getByText('Longo em Z2')).toBeInTheDocument();
    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'false');
  });

  it('descanso não é clicável; status por ícone via data-status, sem borda lateral', () => {
    mock(PLANO);
    renderPage();
    const linhas = screen.getAllByTestId('week-agenda-row');
    expect(linhas.map((r) => r.dataset.status)).toEqual(['concluido', 'descanso', 'pendente', 'descanso', 'descanso', 'futuro', 'descanso']);
    expect(linhas.map((r) => r.dataset.today)).toEqual([undefined, undefined, 'true', undefined, undefined, undefined, undefined]);
    const descanso = linhas[1];
    expect(within(descanso).queryByRole('button')).toBeNull();
    expect(linhas.some((r) => getComputedStyle(r).borderLeftWidth === '4px')).toBe(false);
  });

  it('plano de outra semana (aprovado adiantado): nada expandido e subtítulo com o intervalo', () => {
    mock({ ...PLANO, semanaInicio: '2026-07-06', semanaFim: '2026-07-12', treinosPlanejados: [] });
    renderPage();
    expect(screen.getByText(/Semana de 6 – 12 de jul/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { expanded: true })).toBeNull();
    expect(screen.getByTestId('plan-volume')).toHaveTextContent(/semana ainda não começou/i);
  });

  it('estado vazio quando não há plano aprovado', () => {
    mock(null);
    renderPage();
    expect(screen.getByText(/ainda não aprovou o plano desta semana/i)).toBeInTheDocument();
  });

  it('estado de erro com retry', () => {
    mock(null, { error: new Error('boom') });
    renderPage();
    expect(screen.getByText(/não foi possível carregar seu plano/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('spinner enquanto carrega sem dado', () => {
    mock(null, { loading: true });
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('faixa da prova-alvo acima do plano: sem provas convida a cadastrar; com alvo mostra a prova', () => {
    mock(PLANO);
    renderPage();
    expect(screen.getByTestId('race-target-banner')).toHaveAttribute('data-state', 'vazio');
    expect(screen.getByRole('link', { name: /cadastrar prova/i })).toHaveAttribute('href', '#/athlete/races/new');

    vi.mocked(useAthleteProvas).mockReturnValue({
      provas: [{ id: 'r1', nomeProva: 'Maratona SP', dataProva: '2026-11-01', tipoProva: 'MARATONA', distancia: 'KM_42', provaAlvo: true, semanasFaltando: 17, semanasPreparacao: 16 }],
      loading: false, error: null, fetchProvas: noop,
    });
    renderPage();
    const banners = screen.getAllByTestId('race-target-banner');
    expect(banners[banners.length - 1]).toHaveAttribute('data-state', 'alvo');
    expect(banners[banners.length - 1]).toHaveTextContent('Maratona SP');
  });

  it('a faixa aparece mesmo sem plano aprovado', () => {
    mock(null);
    renderPage();
    expect(screen.getByTestId('race-target-banner')).toBeInTheDocument();
    expect(screen.getByText(/ainda não aprovou o plano/i)).toBeInTheDocument();
  });
});
