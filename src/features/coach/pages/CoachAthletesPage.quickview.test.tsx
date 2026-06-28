import { render, screen, fireEvent, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import CoachAthletesPage from './CoachAthletesPage';
import { useCoachRoster } from '../../../hooks/useCoachRoster';
import type { CoachAtletaResumo } from '../../../types/Coach';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../../hooks/useCoachRoster');
vi.mock('../../../api/services/AtletasService', () => ({ AtletasService: {} }));

// Painel de visão rápida: stub que expõe o id do snapshot recebido (para distinguir qual atleta).
vi.mock('../components/AthleteQuickViewPanel', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AthleteQuickViewPanel: ({ snapshot }: any) => <div>stub-quickview {snapshot.id}</div>,
}));

// DataGrid: render mínimo que (1) aplica getRowClassName, (2) dispara onRowClick no clique da
// linha e (3) renderiza a célula real da coluna '__expand__' (o IconButton com stopPropagation).
vi.mock('@mui/x-data-grid', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GridActionsCellItem: ({ label, onClick }: any) => <button onClick={onClick}>{label}</button>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DataGrid: ({ rows, columns, onRowClick, getRowClassName }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expandCol = columns.find((c: any) => c.field === '__expand__');
    return (
      <div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {rows.map((row: any) => (
          <div
            key={row.id}
            data-testid={`row-${row.id}`}
            className={getRowClassName?.({ id: row.id, row })}
            onClick={(e) => onRowClick?.({ id: row.id, row }, e)}
          >
            <span data-field="name" data-testid={`name-${row.id}`}>{row.name}</span>
            <span data-field="__expand__">{expandCol?.renderCell?.({ row, id: row.id })}</span>
          </div>
        ))}
      </div>
    );
  },
}));

// Dialogs legados: stubs para isolar a página dos serviços deles.
vi.mock('../../../components/features/planos/planosDialog', () => ({ default: () => null }));
vi.mock('../../../components/features/projecao/GerarProjecaoDialog', () => ({ default: () => null }));
vi.mock('../../../components/features/strava/SyncStravaButton', () => ({ default: () => null }));
vi.mock('../../../components/features/atleta/AtletaDialog', () => ({ default: () => null }));
vi.mock('../../../shared/components/ConfirmDialog', () => ({ ConfirmDialog: () => null }));

const ROSTER: CoachAtletaResumo[] = [
  { atletaId: 'a1', nome: 'Ana Silva', status: 'active', weeklyVolume: 32, ctl: 50, atl: 48, tsb: 2, fase: 'BASE' },
  { atletaId: 'a2', nome: 'Bruno Costa', status: 'warning', weeklyVolume: 41, ctl: 55, atl: 62, tsb: -7, fase: 'BUILD' },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/coach/athletes']}>
      <CoachAthletesPage />
    </MemoryRouter>,
  );
}

describe('CoachAthletesPage — visão rápida (expand inline)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCoachRoster).mockReturnValue({
      roster: ROSTER,
      loading: false,
      error: null,
      fetchRoster: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('nenhum painel aparece antes de expandir', () => {
    renderPage();
    expect(screen.queryByText(/stub-quickview/)).not.toBeInTheDocument();
  });

  it('clicar no ícone expande o painel do atleta e NÃO navega', () => {
    renderPage();
    const row = screen.getByTestId('row-a1');
    fireEvent.click(within(row).getByRole('button', { name: /ver tend/i }));

    expect(screen.getByText(/stub-quickview a1/)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('clicar na linha (nome) navega para o perfil e não expande', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('name-a1'));

    expect(navigateMock).toHaveBeenCalledWith('/coach/athletes/a1');
    expect(screen.queryByText(/stub-quickview/)).not.toBeInTheDocument();
  });

  it('expandir outro atleta colapsa o anterior (um painel por vez)', () => {
    renderPage();
    fireEvent.click(within(screen.getByTestId('row-a1')).getByRole('button', { name: /ver tend/i }));
    expect(screen.getByText(/stub-quickview a1/)).toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('row-a2')).getByRole('button', { name: /ver tend/i }));
    expect(screen.getByText(/stub-quickview a2/)).toBeInTheDocument();
    expect(screen.queryByText(/stub-quickview a1/)).not.toBeInTheDocument();
  });

  it('clicar no mesmo ícone novamente recolhe o painel', () => {
    renderPage();
    const trigger = () =>
      within(screen.getByTestId('row-a1')).getByRole('button', { name: /tend/i });
    fireEvent.click(trigger());
    expect(screen.getByText(/stub-quickview a1/)).toBeInTheDocument();

    fireEvent.click(trigger()); // agora o aria-label é "Recolher tendência" (regex /tend/i cobre ambos)
    expect(screen.queryByText(/stub-quickview/)).not.toBeInTheDocument();
  });
});
