import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AthleteProgressPage from './AthleteProgressPage';
import { useAthletePmc } from '../../../hooks/useAthletePmc';
import { useAthleteZones } from '../../../hooks/useAthleteZones';
import { useAthleteRecordes } from '../../../hooks/useAthleteRecordes';
import { useAthleteAderencia } from '../../../hooks/useAthleteAderencia';
import { useAthleteTreinosRecentes } from '../../../hooks/useAthleteTreinosRecentes';

vi.mock('../../../hooks/useAthletePmc');
vi.mock('../../../hooks/useAthleteZones');
vi.mock('../../../hooks/useAthleteRecordes');
vi.mock('../../../hooks/useAthleteAderencia');
vi.mock('../../../hooks/useAthleteTreinosRecentes');

const noop = vi.fn();

const PMC_STUB = [
  { data: '2026-06-01', ctl: 74, atl: 71, tsb: 3, tss: 62, statusForma: 'FORMA_IDEAL' as const },
];

function mockAllReady() {
  vi.mocked(useAthletePmc).mockReturnValue({ pmc: PMC_STUB, loading: false, error: null, fetchPmc: noop });
  vi.mocked(useAthleteZones).mockReturnValue({
    zones: { z1: 600, z2: 0, z3: 300, z4: 0, z5: 0, duracaoTotalSegundos: 900 },
    loading: false, error: null, fetchZones: noop,
  });
  vi.mocked(useAthleteRecordes).mockReturnValue({
    recordes: [{ distancia: '10k', tempoSegundos: 2730, data: '2026-05-08', treinoRealizadoId: 'abc' }],
    loading: false, error: null, fetchRecordes: noop,
  });
  vi.mocked(useAthleteAderencia).mockReturnValue({
    aderencia: [{ semanaInicio: '2026-06-01', totalPlanejado: 5, totalRealizado: 4, percentual: 80 }],
    loading: false, error: null, fetchAderencia: noop,
  });
  vi.mocked(useAthleteTreinosRecentes).mockReturnValue({
    treinos: [{ dataTreino: '2026-06-01', distanciaKm: 10 }, { dataTreino: '2026-06-03', distanciaKm: 12 }],
    loading: false, error: null, fetchTreinosRecentes: noop,
  });
}

describe('AthleteProgressPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllReady();
  });

  it('renderiza KPIs reais na aba Visão Geral, sem mock', () => {
    render(<AthleteProgressPage />);

    expect(screen.getByText('74')).toBeInTheDocument(); // CTL real
    expect(screen.getByText('+3')).toBeInTheDocument(); // TSB com sinal
    expect(screen.getByText('22')).toBeInTheDocument(); // Volume: 10+12=22km
    expect(screen.getByText('4')).toBeInTheDocument(); // Treinos concluídos
    expect(screen.getByText('de 5')).toBeInTheDocument();
  });

  it('mostra spinner de página inteira quando tudo ainda está carregando sem dado', () => {
    vi.mocked(useAthletePmc).mockReturnValue({ pmc: [], loading: true, error: null, fetchPmc: noop });
    vi.mocked(useAthleteZones).mockReturnValue({ zones: null, loading: true, error: null, fetchZones: noop });
    vi.mocked(useAthleteRecordes).mockReturnValue({ recordes: [], loading: true, error: null, fetchRecordes: noop });
    vi.mocked(useAthleteAderencia).mockReturnValue({ aderencia: [], loading: true, error: null, fetchAderencia: noop });
    vi.mocked(useAthleteTreinosRecentes).mockReturnValue({ treinos: [], loading: true, error: null, fetchTreinosRecentes: noop });

    render(<AthleteProgressPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('aba Forma mostra erro com retry quando o histórico PMC falha', async () => {
    vi.mocked(useAthletePmc).mockReturnValue({ pmc: [], loading: false, error: new Error('boom'), fetchPmc: noop });
    const user = userEvent.setup();
    render(<AthleteProgressPage />);

    await user.click(screen.getByRole('tab', { name: 'Forma' }));

    expect(screen.getByText(/não foi possível carregar seu histórico de forma/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('aba Volume mostra estado vazio quando não há dados de zona (duracaoTotalSegundos=0)', async () => {
    vi.mocked(useAthleteZones).mockReturnValue({
      zones: { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, duracaoTotalSegundos: 0 },
      loading: false, error: null, fetchZones: noop,
    });
    const user = userEvent.setup();
    render(<AthleteProgressPage />);

    await user.click(screen.getByRole('tab', { name: 'Volume' }));

    expect(screen.getByText(/ainda não há dados de zona/i)).toBeInTheDocument();
  });

  it('aba Provas mostra "ainda sem recordes" quando a lista vem vazia, sem inventar PR', async () => {
    vi.mocked(useAthleteRecordes).mockReturnValue({ recordes: [], loading: false, error: null, fetchRecordes: noop });
    const user = userEvent.setup();
    render(<AthleteProgressPage />);

    await user.click(screen.getByRole('tab', { name: 'Provas' }));

    expect(screen.getByText('Ainda sem recordes.')).toBeInTheDocument();
  });

  it('aba Provas mostra o recorde real formatado quando presente', async () => {
    const user = userEvent.setup();
    render(<AthleteProgressPage />);

    await user.click(screen.getByRole('tab', { name: 'Provas' }));

    expect(screen.getByText('10k')).toBeInTheDocument();
    expect(screen.getByText('00:45:30')).toBeInTheDocument();
  });
});
