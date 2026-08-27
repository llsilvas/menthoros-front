import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import AthleteProgressPage from './AthleteProgressPage';
import { useAthletePmc } from '../../../hooks/useAthletePmc';
import { useAthleteZones } from '../../../hooks/useAthleteZones';
import { useAthleteRecordes } from '../../../hooks/useAthleteRecordes';
import { useAthleteAderencia } from '../../../hooks/useAthleteAderencia';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';

vi.mock('../../../hooks/useAthletePmc');
vi.mock('../../../hooks/useAthleteZones');
vi.mock('../../../hooks/useAthleteRecordes');
vi.mock('../../../hooks/useAthleteAderencia');
vi.mock('../../../hooks/useAthleteProvas');
vi.mock('../components/PMCChart', () => ({ PMCChart: () => <div data-testid="pmc-chart-mock">CTL ATL TSB</div> }));

const noop = vi.fn();
const HOJE = new Date(2026, 7, 26, 9);

const PMC = [
  { data: '2026-07-29', ctl: 42, atl: 40, tsb: 2, tss: 50 },
  { data: '2026-08-26', ctl: 48, atl: 44, tsb: 4, tss: 62, statusForma: 'FORMA_IDEAL' as const },
];

function mockAllReady() {
  vi.mocked(useAthletePmc).mockReturnValue({ pmc: PMC, loading: false, error: null, fetchPmc: noop });
  vi.mocked(useAthleteZones).mockReturnValue({ zones: { z1: 12, z2: 62, z3: 10, z4: 13, z5: 3, duracaoTotalSegundos: 100 }, loading: false, error: null, fetchZones: noop });
  vi.mocked(useAthleteRecordes).mockReturnValue({ recordes: [{ distancia: '10k', tempoSegundos: 2730, data: '2026-08-10', treinoRealizadoId: 'abc' }], loading: false, error: null, fetchRecordes: noop });
  vi.mocked(useAthleteAderencia).mockReturnValue({ aderencia: [{ semanaInicio: '2026-08-24', totalPlanejado: 3, totalRealizado: 2, percentual: 67 }], loading: false, error: null, fetchAderencia: noop });
  vi.mocked(useAthleteProvas).mockReturnValue({ provas: [{ id: '1', nomeProva: 'Maratona de SP', dataProva: '2026-10-10', tipoProva: 'MARATONA', distancia: 'KM_42', diasFaltando: 45 }] as never, loading: false, error: null, fetchProvas: noop });
}

function renderPage() {
  const router = createHashRouter([{ path: '/', element: <AthleteProgressPage /> }, { path: '/athlete/coach', element: <div>coach</div> }]);
  return render(<RouterProvider router={router} />);
}

describe('AthleteProgressPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(HOJE);
    mockAllReady();
  });
  afterEach(() => vi.useRealTimers());

  it('quatro blocos no fluxo, sem abas, sem jargão fora do gráfico, com "Falar com o coach" em cada um', () => {
    renderPage();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    for (const id of ['progress-stronger', 'progress-zones', 'progress-adherence', 'progress-records']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('link', { name: /falar com o coach/i })).toHaveLength(4);
    expect(screen.queryByText(/\b(CTL|ATL|TSB)\b/)).toBeNull();
    expect(screen.queryByText(/\bpts\b/)).toBeNull();
    expect(screen.getByTestId('progress-stronger-reading')).toHaveTextContent('Sua carga subiu +6');
    expect(screen.getByText(/Z2 — 62%/)).toBeInTheDocument();
    expect(screen.getByTestId('progress-adherence-count')).toHaveTextContent('2 de 3');
    expect(screen.getByTestId('progress-next-race')).toHaveTextContent(/Maratona de SP em 45 dias/);
  });

  it('o gráfico completo expande inline e continua sendo o PMCChart', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /ver o gráfico completo/i }));
    expect(await screen.findByTestId('pmc-chart-mock')).toBeInTheDocument();
    expect(screen.getByTestId('progress-stronger')).toContainElement(screen.getByTestId('pmc-chart-mock'));
  });

  it('cada bloco falha sozinho: erro em zonas não derruba os outros', () => {
    vi.mocked(useAthleteZones).mockReturnValue({ zones: null, loading: false, error: new Error('x'), fetchZones: noop });
    renderPage();
    expect(screen.getByText(/não foi possível carregar sua distribuição de zonas/i)).toBeInTheDocument();
    expect(screen.getByTestId('progress-stronger')).toBeInTheDocument();
    expect(screen.getByTestId('progress-adherence')).toBeInTheDocument();
  });

  it('tudo falhando: um Alert consolidado com retry', async () => {
    const fetchPmc = vi.fn();
    vi.mocked(useAthletePmc).mockReturnValue({ pmc: [], loading: false, error: new Error('a'), fetchPmc });
    vi.mocked(useAthleteZones).mockReturnValue({ zones: null, loading: false, error: new Error('b'), fetchZones: noop });
    vi.mocked(useAthleteRecordes).mockReturnValue({ recordes: [], loading: false, error: new Error('c'), fetchRecordes: noop });
    vi.mocked(useAthleteAderencia).mockReturnValue({ aderencia: [], loading: false, error: new Error('d'), fetchAderencia: noop });
    renderPage();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(fetchPmc).toHaveBeenCalledTimes(2); // montagem + retry
  });

  it('estados vazios honestos por bloco', () => {
    vi.mocked(useAthletePmc).mockReturnValue({ pmc: [], loading: false, error: null, fetchPmc: noop });
    vi.mocked(useAthleteAderencia).mockReturnValue({ aderencia: [], loading: false, error: null, fetchAderencia: noop });
    vi.mocked(useAthleteRecordes).mockReturnValue({ recordes: [], loading: false, error: null, fetchRecordes: noop });
    renderPage();
    expect(screen.getByText(/ainda não há histórico de forma/i)).toBeInTheDocument();
    expect(screen.getByText(/sem plano aprovado nas últimas semanas/i)).toBeInTheDocument();
    expect(screen.getByText(/ainda sem recordes/i)).toBeInTheDocument();
  });

  it('PMC curto: "Ainda cedo para comparar" sem inventar delta', () => {
    vi.mocked(useAthletePmc).mockReturnValue({ pmc: [PMC[1]], loading: false, error: null, fetchPmc: noop });
    renderPage();
    expect(screen.getByTestId('progress-stronger-reading')).toHaveTextContent('Ainda cedo para comparar');
  });
});
