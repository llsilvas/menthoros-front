import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AthleteProgressPage from './AthleteProgressPage';
import { useAthletePmc } from '../../../hooks/useAthletePmc';
import { useAthleteZones } from '../../../hooks/useAthleteZones';
import { useAthleteRecordes } from '../../../hooks/useAthleteRecordes';
import { useAthleteAderencia } from '../../../hooks/useAthleteAderencia';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';
import { useManualTraining } from '../../../hooks/useManualTraining';

vi.mock('../../../hooks/useAthletePmc');
vi.mock('../../../hooks/useAthleteZones');
vi.mock('../../../hooks/useAthleteRecordes');
vi.mock('../../../hooks/useAthleteAderencia');
vi.mock('../../../hooks/useAthleteProvas');
vi.mock('../../../hooks/useManualTraining');

const noop = vi.fn();
const noopAsync = vi.fn().mockResolvedValue(undefined);

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
  vi.mocked(useAthleteProvas).mockReturnValue({
    provas: [{ id: '1', nomeProva: 'Maratona de SP', dataProva: '2099-08-18', tipoProva: 'MARATONA', distancia: 'KM_42', diasFaltando: 45 }],
    loading: false, error: null, fetchProvas: noop,
  });
  vi.mocked(useManualTraining).mockReturnValue({
    recentes: [
      {
        id: '1', dataTreino: '2026-06-01', tipoTreino: 'TREINO_LONGO', duracaoMin: '01:00:00', distanciaKm: 10,
        fonteDados: { value: 'MANUAL', label: 'Manual' }, status: { value: 'CONCLUIDO', label: 'Concluído' },
      },
      {
        id: '2', dataTreino: '2026-06-03', tipoTreino: 'CONTINUO', duracaoMin: '00:40:00', distanciaKm: 12,
        fonteDados: { value: 'MANUAL', label: 'Manual' }, status: { value: 'CONCLUIDO', label: 'Concluído' },
      },
    ],
    isFetching: false, isSubmitting: false, fetchError: null, registrar: noop, fetchRecentes: noopAsync,
  });
}

describe('AthleteProgressPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllReady();
  });

  it('renderiza KPIs reais na aba Visão Geral, sem mock', async () => {
    render(<AthleteProgressPage />);

    expect(screen.getByText('74')).toBeInTheDocument(); // CTL real
    expect(screen.getByText('+3')).toBeInTheDocument(); // TSB com sinal
    expect(await screen.findByText('22')).toBeInTheDocument(); // Volume: 10+12=22km (após fetchRecentes resolver)
    expect(screen.getByText('4')).toBeInTheDocument(); // Treinos concluídos
    expect(screen.getByText('de 5')).toBeInTheDocument();
  });

  it('não fabrica "0 km" antes do fetchRecentes (useManualTraining) resolver', () => {
    // useManualTraining.isFetching começa em `false` (diferente dos outros hooks desta página) —
    // sem o guard local `treinosFetched`, o primeiro render mostraria "0" em vez de "—".
    vi.mocked(useManualTraining).mockReturnValue({
      recentes: [], isFetching: false, isSubmitting: false, fetchError: null,
      registrar: noop, fetchRecentes: vi.fn(() => new Promise<void>(() => {})), // nunca resolve neste teste
    });

    render(<AthleteProgressPage />);

    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('mostra spinner de página inteira quando tudo ainda está carregando sem dado', () => {
    vi.mocked(useAthletePmc).mockReturnValue({ pmc: [], loading: true, error: null, fetchPmc: noop });
    vi.mocked(useAthleteZones).mockReturnValue({ zones: null, loading: true, error: null, fetchZones: noop });
    vi.mocked(useAthleteRecordes).mockReturnValue({ recordes: [], loading: true, error: null, fetchRecordes: noop });
    vi.mocked(useAthleteAderencia).mockReturnValue({ aderencia: [], loading: true, error: null, fetchAderencia: noop });
    vi.mocked(useManualTraining).mockReturnValue({
      recentes: [], isFetching: true, isSubmitting: false, fetchError: null,
      registrar: noop, fetchRecentes: vi.fn(() => new Promise<void>(() => {})),
    });

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

  it('aba Provas mostra a próxima prova real (nome + diasFaltando do DTO)', async () => {
    const user = userEvent.setup();
    render(<AthleteProgressPage />);

    await user.click(screen.getByRole('tab', { name: 'Provas' }));

    expect(screen.getByText(/faltam 45 dias para maratona de sp/i)).toBeInTheDocument();
  });

  it('aba Provas mostra CTA honesto quando não há prova futura cadastrada, sem inventar', async () => {
    vi.mocked(useAthleteProvas).mockReturnValue({ provas: [], loading: false, error: null, fetchProvas: noop });
    const user = userEvent.setup();
    render(<AthleteProgressPage />);

    await user.click(screen.getByRole('tab', { name: 'Provas' }));

    expect(screen.getByText(/peça ao seu coach para cadastrar sua próxima prova/i)).toBeInTheDocument();
  });

  it('aba Provas não mostra o CTA de "sem meta" enquanto a próxima prova ainda está carregando', async () => {
    vi.mocked(useAthleteProvas).mockReturnValue({ provas: [], loading: true, error: null, fetchProvas: noop });
    const user = userEvent.setup();
    render(<AthleteProgressPage />);

    await user.click(screen.getByRole('tab', { name: 'Provas' }));

    expect(screen.queryByText(/peça ao seu coach/i)).toBeNull();
    expect(screen.queryByText(/próxima meta/i)).toBeNull();
  });

  it('aba Provas mostra erro com retry quando a próxima prova falha (não conflar com "sem meta")', async () => {
    vi.mocked(useAthleteProvas).mockReturnValue({ provas: [], loading: false, error: new Error('boom'), fetchProvas: noop });
    const user = userEvent.setup();
    render(<AthleteProgressPage />);

    await user.click(screen.getByRole('tab', { name: 'Provas' }));

    expect(screen.getByText(/não foi possível carregar sua próxima prova/i)).toBeInTheDocument();
    expect(screen.queryByText(/peça ao seu coach/i)).toBeNull();
  });

  it('aba Provas não fabrica "0 dias" quando o DTO não traz diasFaltando', async () => {
    vi.mocked(useAthleteProvas).mockReturnValue({
      provas: [{ id: '1', nomeProva: 'Prova Sem Contagem', dataProva: '2099-08-18', tipoProva: 'MARATONA', distancia: 'KM_42' }],
      loading: false, error: null, fetchProvas: noop,
    });
    const user = userEvent.setup();
    render(<AthleteProgressPage />);

    await user.click(screen.getByRole('tab', { name: 'Provas' }));

    expect(screen.getByText(/sua próxima meta: prova sem contagem/i)).toBeInTheDocument();
  });
});
