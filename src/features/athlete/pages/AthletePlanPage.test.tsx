import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AthletePlanPage from './AthletePlanPage';
import { useAthletePlan } from '../../../hooks/useAthletePlan';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';

vi.mock('../../../hooks/useAthletePlan');

const noop = vi.fn();

const PLANO: PlanoSemanal = {
  id: 'p1', atletaId: 'a1', semanaInicio: '2026-06-29', semanaFim: '2026-07-05',
  volumePlanejadoKm: 40, volumeRealizadoKm: 22, volumeAlvoKm: 45, status: 'ATIVO',
  objetivoSemanal: 'Semana de construção',
  treinosPlanejados: [
    { tipoTreino: 'INTERVALADO', distanciaKm: 10, dataTreino: '2026-07-01', descricao: '6x1km',
      tssPlanejado: 90, duracaoMin: '01:05:00', statusTreino: 'PENDENTE', diaSemana: 'QUARTA' },
  ],
};

function renderPage() {
  return render(<AthletePlanPage />);
}

describe('AthletePlanPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza o plano real com volume (km), não TSS mock', () => {
    vi.mocked(useAthletePlan).mockReturnValue({ plano: PLANO, loading: false, error: null, fetchPlano: noop });
    renderPage();

    expect(screen.getByText('22 / 40 km')).toBeInTheDocument(); // volume real, D0.5
    expect(screen.getByText(/Semana de construção/)).toBeInTheDocument();
    expect(screen.queryByText(/425 \/ 480/)).toBeNull(); // sem MOCK_TSS
  });

  it('estado vazio quando não há plano aprovado', () => {
    vi.mocked(useAthletePlan).mockReturnValue({ plano: null, loading: false, error: null, fetchPlano: noop });
    renderPage();

    expect(screen.getByText(/ainda não aprovou o plano desta semana/i)).toBeInTheDocument();
  });

  it('estado de erro com retry', () => {
    vi.mocked(useAthletePlan).mockReturnValue({ plano: null, loading: false, error: new Error('boom'), fetchPlano: noop });
    renderPage();

    expect(screen.getByText(/não foi possível carregar seu plano/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('spinner enquanto carrega sem dado', () => {
    vi.mocked(useAthletePlan).mockReturnValue({ plano: null, loading: true, error: null, fetchPlano: noop });
    renderPage();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
