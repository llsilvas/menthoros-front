import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import AthleteHomePage from './AthleteHomePage';
import { useAthleteHome } from '../../../hooks/useAthleteHome';
import { useAthleteReadiness } from '../../../hooks/useAthleteReadiness';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';
import { useManualTraining } from '../../../hooks/useManualTraining';
import { useRegistrarCheckin } from '../../../hooks/useRegistrarCheckin';
import { useUserInfo } from '../../../hooks/useUserInfo';

vi.mock('../../../hooks/useAthleteHome');
vi.mock('../../../hooks/useAthleteReadiness');
vi.mock('../../../hooks/useAthleteProvas');
vi.mock('../../../hooks/useManualTraining');
vi.mock('../../../hooks/useRegistrarCheckin');
vi.mock('../../../hooks/useUserInfo');

const noop = vi.fn();

function mockHome(overrides: Partial<ReturnType<typeof useAthleteHome>> = {}) {
  vi.mocked(useAthleteHome).mockReturnValue({
    home: { proximoTreino: { tipoTreino: 'INTERVALADO', descricao: 'Tiros de 400m' },
            metricasChave: { ctl: 74, atl: 71, tsb: 3, tss: 62 } },
    loading: false, error: null, fetchHome: noop, ...overrides,
  });
}

function renderPage() {
  return render(<MemoryRouter><AthleteHomePage /></MemoryRouter>);
}

describe('AthleteHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserInfo).mockReturnValue({ name: 'Carlos Silva' });
    vi.mocked(useAthleteReadiness).mockReturnValue({
      readiness: { score: 78, nota: 'Provisório.' }, loading: false, error: null, fetchReadiness: noop,
    });
    vi.mocked(useManualTraining).mockReturnValue({
      recentes: [], isFetching: false, isSubmitting: false, fetchError: null,
      registrar: noop, fetchRecentes: noop,
    });
    vi.mocked(useAthleteProvas).mockReturnValue({
      provas: [], loading: false, error: null, fetchProvas: noop,
    });
    vi.mocked(useRegistrarCheckin).mockReturnValue({
      registrar: vi.fn().mockResolvedValue(undefined), loading: false, error: null,
    });
  });

  it('renderiza métricas reais e o primeiro nome do atleta (JWT), sem mock', () => {
    mockHome();
    renderPage();

    expect(screen.getByText('62')).toBeInTheDocument(); // TSS real
    expect(screen.getByText('+3')).toBeInTheDocument(); // forma com sinal
    expect(screen.getByText(/Carlos/)).toBeInTheDocument(); // saudação com o nome do JWT
    expect(screen.getByText('Tiros de 400m')).toBeInTheDocument();
    // não deve haver o conteúdo mockado antigo
    expect(screen.queryByText(/Corrida Fácil/)).toBeNull();
  });

  it('mostra estado de erro com retry quando a Home falha', () => {
    mockHome({ home: null, error: new Error('boom') });
    renderPage();

    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('mostra spinner enquanto carrega sem dado', () => {
    mockHome({ home: null, loading: true });
    renderPage();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('mostra aviso de prontidão indisponível quando readiness falha (não engole erro)', () => {
    mockHome();
    vi.mocked(useAthleteReadiness).mockReturnValue({
      readiness: null, loading: false, error: new Error('boom'), fetchReadiness: noop,
    });
    renderPage();

    expect(screen.getByText(/prontidão indisponível/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recarregar/i })).toBeInTheDocument();
  });

  it('oculta o ReadinessCard quando score é null (não fabrica)', () => {
    mockHome();
    vi.mocked(useAthleteReadiness).mockReturnValue({
      readiness: { score: undefined, nota: 'Sem sinais.' }, loading: false, error: null, fetchReadiness: noop,
    });
    renderPage();

    // ReadinessCard não renderiza sem score → a nota do readiness não aparece
    expect(screen.queryByText('Sem sinais.')).toBeNull();
  });

  it('mostra o card de streak quando há semanas consecutivas com treino', () => {
    mockHome();
    vi.mocked(useManualTraining).mockReturnValue({
      recentes: [
        { id: '1', dataTreino: new Date().toISOString().slice(0, 10), tipoTreino: 'CONTINUO', duracaoMin: '00:30:00', fonteDados: { value: 'MANUAL', label: 'Manual' }, status: { value: 'CONCLUIDO', label: 'Concluído' } },
      ],
      isFetching: false, isSubmitting: false, fetchError: null, registrar: noop, fetchRecentes: noop,
    });
    renderPage();

    expect(screen.getByText(/semana seguida treinando|semanas seguidas treinando/i)).toBeInTheDocument();
  });

  it('oculta o card de streak quando streak é 0 (não mostra "0 semanas")', () => {
    mockHome();
    // useManualTraining mockado no beforeEach já retorna recentes: [] → streak 0
    renderPage();

    expect(screen.queryByText(/semanas? seguidas? treinando/i)).toBeNull();
  });

  it('mostra aviso com retry quando o streak falha (não engole erro como "sem streak")', () => {
    mockHome();
    vi.mocked(useManualTraining).mockReturnValue({
      recentes: [], isFetching: false, isSubmitting: false, fetchError: new Error('boom'),
      registrar: noop, fetchRecentes: noop,
    });
    renderPage();

    expect(screen.getByText(/não foi possível carregar seu streak/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /recarregar/i }).length).toBeGreaterThan(0);
  });

  it('mostra a próxima prova real (nome + diasFaltando do DTO)', () => {
    mockHome();
    vi.mocked(useAthleteProvas).mockReturnValue({
      provas: [{ id: '1', nomeProva: 'Maratona de SP', dataProva: '2099-08-18', tipoProva: 'MARATONA', distancia: 'KM_42', diasFaltando: 45 }],
      loading: false, error: null, fetchProvas: noop,
    });
    renderPage();

    expect(screen.getByText(/faltam 45 dias para maratona de sp/i)).toBeInTheDocument();
  });

  it('mostra CTA honesto quando não há prova futura cadastrada, sem inventar', () => {
    mockHome();
    // useAthleteProvas mockado no beforeEach já retorna provas: [] → sem próxima meta
    renderPage();

    expect(screen.getByText(/peça ao seu coach para cadastrar sua próxima prova/i)).toBeInTheDocument();
  });

  it('não mostra o CTA de "sem meta" enquanto a próxima prova ainda está carregando', () => {
    mockHome();
    vi.mocked(useAthleteProvas).mockReturnValue({ provas: [], loading: true, error: null, fetchProvas: noop });
    renderPage();

    expect(screen.queryByText(/peça ao seu coach/i)).toBeNull();
  });

  it('mostra aviso com retry quando a próxima prova falha (não conflar com "sem meta")', () => {
    mockHome();
    vi.mocked(useAthleteProvas).mockReturnValue({ provas: [], loading: false, error: new Error('boom'), fetchProvas: noop });
    renderPage();

    expect(screen.getByText(/não foi possível carregar sua próxima prova/i)).toBeInTheDocument();
    expect(screen.queryByText(/peça ao seu coach/i)).toBeNull();
  });

  it('submete o check-in real: chama registrar, refetch de readiness e fecha o modal', async () => {
    mockHome();
    const registrar = vi.fn().mockResolvedValue(undefined);
    const fetchReadiness = vi.fn();
    vi.mocked(useRegistrarCheckin).mockReturnValue({ registrar, loading: false, error: null });
    vi.mocked(useAthleteReadiness).mockReturnValue({
      readiness: { score: 78, nota: 'Provisório.' }, loading: false, error: null, fetchReadiness,
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /iniciar treino/i }));
    expect(screen.getByText('Como você está hoje?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^registrar$/i }));

    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({
      qualidadeSono: expect.any(Number), humor: expect.any(Number),
      doresMusculares: expect.any(Number), nivelEnergia: expect.any(Number), estresse: expect.any(Number),
    }));
    await waitFor(() => expect(fetchReadiness).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Como você está hoje?')).toBeNull());
  });

  it('mantém o modal aberto com erro quando o check-in falha (não fecha silenciosamente)', async () => {
    mockHome();
    const registrar = vi.fn().mockRejectedValue(new Error('boom'));
    vi.mocked(useRegistrarCheckin).mockReturnValue({ registrar, loading: false, error: new Error('boom') });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /iniciar treino/i }));
    await user.click(screen.getByRole('button', { name: /^registrar$/i }));

    expect(await screen.findByText(/não foi possível salvar seu check-in/i)).toBeInTheDocument();
    expect(screen.getByText('Como você está hoje?')).toBeInTheDocument(); // modal continua aberto
  });
});
