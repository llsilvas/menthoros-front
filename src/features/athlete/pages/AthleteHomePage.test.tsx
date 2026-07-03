import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AthleteHomePage from './AthleteHomePage';
import { useAthleteHome } from '../../../hooks/useAthleteHome';
import { useAthleteReadiness } from '../../../hooks/useAthleteReadiness';
import { useUserInfo } from '../../../hooks/useUserInfo';

vi.mock('../../../hooks/useAthleteHome');
vi.mock('../../../hooks/useAthleteReadiness');
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

  it('oculta o ReadinessCard quando score é null (não fabrica)', () => {
    mockHome();
    vi.mocked(useAthleteReadiness).mockReturnValue({
      readiness: { score: undefined, nota: 'Sem sinais.' }, loading: false, error: null, fetchReadiness: noop,
    });
    renderPage();

    // ReadinessCard não renderiza sem score → a nota do readiness não aparece
    expect(screen.queryByText('Sem sinais.')).toBeNull();
  });
});
