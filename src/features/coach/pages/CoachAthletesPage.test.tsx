import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import CoachAthletesPage from './CoachAthletesPage';
import { useCoachRoster } from '../../../hooks/useCoachRoster';
import { AtletasService } from '../../../api/services/AtletasService';
import type { CoachAtletaResumo } from '../../../types/Coach';

vi.mock('../../../hooks/useCoachRoster');
vi.mock('../../../api/services/AtletasService');

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
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {columns.filter((c: any) => c.renderCell && c.type !== 'actions').map((c: any) => (
            <div key={c.field} data-testid={`cell-${c.field}-${row.id}`}>{c.renderCell({ row })}</div>
          ))}
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
vi.mock('../../../components/features/atleta/AtletaDialog', () => ({
  // distingue criar (sem atleta) de editar (com atleta) pelo texto renderizado
  default: ({ open, atleta }: { open: boolean; atleta?: { id: string } }) =>
    open ? <div>stub-atleta-dialog {atleta ? 'edit' : 'new'}</div> : null,
}));
vi.mock('../../../shared/components/ConfirmDialog', () => ({
  ConfirmDialog: ({ open, onConfirm }: { open: boolean; onConfirm: () => void }) =>
    open ? <button onClick={onConfirm}>stub-confirm</button> : null,
}));
vi.mock('../../../components/features/planos/BatchPlanDialog', () => ({
  BatchPlanDialog: ({ open }: { open: boolean }) => (open ? <div>stub-batch</div> : null),
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(AtletasService.buscarAtletaPorId).mockResolvedValue({ id: 'a1', nome: 'Ana Silva' } as any);
    vi.mocked(AtletasService.deletarAtleta).mockResolvedValue(undefined);
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

  it('"Adicionar" abre o dialog de novo atleta (sem dados)', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));
    expect(screen.getByText(/stub-atleta-dialog\s+new/)).toBeInTheDocument();
  });

  it('"Editar" busca o atleta completo e abre o dialog preenchido', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    expect(await screen.findByText(/stub-atleta-dialog\s+edit/)).toBeInTheDocument();
    expect(AtletasService.buscarAtletaPorId).toHaveBeenCalledWith('a1');
  });

  it('"Excluir" pede confirmação e chama deletarAtleta ao confirmar', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Excluir'));
    const confirmar = screen.getByText('stub-confirm');
    fireEvent.click(confirmar);
    await waitFor(() => expect(AtletasService.deletarAtleta).toHaveBeenCalledWith('a1'));
  });

  it('falha na exclusão exibe feedback de erro', async () => {
    vi.mocked(AtletasService.deletarAtleta).mockRejectedValueOnce(new Error('boom'));
    renderPage();
    fireEvent.click(screen.getByText('Excluir'));
    fireEvent.click(screen.getByText('stub-confirm'));
    expect(await screen.findByText(/Não foi possível excluir o atleta/i)).toBeInTheDocument();
  });

  it('"Gerar planos" está desabilitado sem seleção e não abre o dialog de lote', () => {
    renderPage();
    const btn = screen.getByRole('button', { name: /Gerar planos/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(screen.queryByText('stub-batch')).not.toBeInTheDocument();
  });
});

describe('CoachAthletesPage — coluna de vencimento do plano', () => {
  function renderComRoster(roster: CoachAtletaResumo[]) {
    vi.clearAllMocks();
    vi.mocked(useCoachRoster).mockReturnValue({
      roster,
      loading: false,
      error: null,
      fetchRoster: vi.fn().mockResolvedValue(undefined),
    });
    return render(
      <MemoryRouter initialEntries={['/coach/athletes']}>
        <CoachAthletesPage />
      </MemoryRouter>,
    );
  }

  it('exibe "—" sem badge quando dataVencimentoPlano ausente', () => {
    renderComRoster([{ atletaId: 'a1', nome: 'Ana Silva', status: 'active', weeklyVolume: 32 }]);
    expect(screen.getByTestId('cell-vencimentoPlano-a1')).toHaveTextContent('—');
  });

  it('exibe badge Vencido quando statusVencimentoPlano é VENCIDO', () => {
    renderComRoster([{
      atletaId: 'a1', nome: 'Ana Silva', status: 'active', weeklyVolume: 32,
      dataVencimentoPlano: '2026-06-01', statusVencimentoPlano: 'VENCIDO',
    }]);
    expect(screen.getByTestId('cell-vencimentoPlano-a1')).toHaveTextContent('Vencido');
  });

  it('exibe badge Vence em breve quando statusVencimentoPlano é PROXIMO_VENCIMENTO', () => {
    renderComRoster([{
      atletaId: 'a1', nome: 'Ana Silva', status: 'active', weeklyVolume: 32,
      dataVencimentoPlano: '2026-07-20', statusVencimentoPlano: 'PROXIMO_VENCIMENTO',
    }]);
    expect(screen.getByTestId('cell-vencimentoPlano-a1')).toHaveTextContent('Vence em breve');
  });

  it('exibe badge Em dia quando statusVencimentoPlano é EM_DIA', () => {
    renderComRoster([{
      atletaId: 'a1', nome: 'Ana Silva', status: 'active', weeklyVolume: 32,
      dataVencimentoPlano: '2026-12-31', statusVencimentoPlano: 'EM_DIA',
    }]);
    expect(screen.getByTestId('cell-vencimentoPlano-a1')).toHaveTextContent('Em dia');
  });
});
