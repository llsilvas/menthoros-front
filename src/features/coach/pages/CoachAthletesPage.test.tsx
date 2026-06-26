import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import CoachAthletesPage from './CoachAthletesPage';
import { useCoachRoster } from '../../../hooks/useCoachRoster';
import type { CoachAtletaResumo } from '../../../types/Coach';

vi.mock('../../../hooks/useCoachRoster');

// @mui/x-data-grid importa um .css que o vitest não resolve (por isso o projeto não testa DataGrid).
// Stub que renderiza headers e, para a coluna `actions`, executa o `getActions` real desta página —
// assim testamos o disparo do menu sem virtualização nem CSS.
vi.mock('@mui/x-data-grid', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GridActionsCellItem: ({ label, onClick }: any) => <button onClick={onClick}>{label}</button>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DataGrid: ({ rows, columns }: any) => (
    <div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {columns.map((c: any) => <span key={c.field}>{c.headerName}</span>)}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {rows.map((row: any) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {columns.filter((c: any) => c.type === 'actions').flatMap((c: any) => c.getActions({ row }))}
        </div>
      ))}
    </div>
  ),
}));

// Dialogs legados reusados as-is — stub para isolar a página do fetch/serviços deles.
vi.mock('../../../components/features/planos/planosDialog', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>stub-planos</div> : null),
}));
vi.mock('../../../components/features/projecao/GerarProjecaoDialog', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>stub-projecao</div> : null),
}));
vi.mock('../../../components/features/strava/SyncStravaButton', () => ({
  default: () => <div>stub-strava</div>,
}));

const ROSTER: CoachAtletaResumo[] = [
  { atletaId: 'a1', nome: 'Ana Silva', status: 'active', weeklyVolume: 32, ctl: 50, atl: 48, tsb: 2, fase: 'BASE', lastActivity: '2026-06-24' },
];

describe('CoachAthletesPage — ações por atleta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCoachRoster).mockReturnValue({
      roster: ROSTER,
      loading: false,
      error: null,
      fetchRoster: vi.fn().mockResolvedValue(undefined),
    });
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/coach/athletes']}>
        <CoachAthletesPage />
      </MemoryRouter>,
    );
  }

  it('expõe a coluna de Ações e os itens do menu por atleta', () => {
    renderPage();
    expect(screen.getByText('Ações')).toBeInTheDocument();
    expect(screen.getByText('Plano')).toBeInTheDocument();
    expect(screen.getByText('Sincronizar Strava')).toBeInTheDocument();
    expect(screen.getByText('Projeção de prova')).toBeInTheDocument();
  });

  it('nenhum dialog aparece antes de interação', () => {
    renderPage();
    expect(screen.queryByText('stub-planos')).not.toBeInTheDocument();
    expect(screen.queryByText('stub-projecao')).not.toBeInTheDocument();
  });

  it('clicar "Plano" abre o dialog de planos do atleta', () => {
    renderPage();
    fireEvent.click(screen.getByText('Plano'));
    expect(screen.getByText('stub-planos')).toBeInTheDocument();
  });

  it('clicar "Projeção de prova" abre o dialog de projeção', () => {
    renderPage();
    fireEvent.click(screen.getByText('Projeção de prova'));
    expect(screen.getByText('stub-projecao')).toBeInTheDocument();
  });

  it('clicar "Sincronizar Strava" abre o dialog com o botão de sync', () => {
    renderPage();
    fireEvent.click(screen.getByText('Sincronizar Strava'));
    expect(screen.getByText('stub-strava')).toBeInTheDocument();
  });
});
