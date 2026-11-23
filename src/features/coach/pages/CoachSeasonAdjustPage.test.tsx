import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import CoachSeasonAdjustPage from './CoachSeasonAdjustPage';
import { ApiError } from '../../../api/core/ApiError';
import { SeasonPlanService } from '../../../api/services/SeasonPlanService';
import type { SeasonPlan } from '../../../types/SeasonPlan';

vi.mock('../../../api/services/SeasonPlanService');

const DRAFT: SeasonPlan = {
  id: 'v2', seasonStatus: 'PROPOSED', provaId: 'p1', provaNome: 'Maratona SP', provaData: '2027-04-04',
  shortPreparation: false, totalWeeks: 2, initialCtl: 40, peakVolumeKm: 50, version: 2, baseSeasonPlanId: 'v1',
  weeks: [
    { weekIndex: 1, weekStart: '2026-11-16', phase: 'BASE', targetVolumeKm: 40, targetTss: 300, deload: false, valueSource: 'ENGINE', locked: true, lockReason: 'IN_PROGRESS' },
    { weekIndex: 2, weekStart: '2026-11-23', phase: 'BASE', targetVolumeKm: 42, targetTss: 310, deload: false, longRunKm: 12, valueSource: 'ENGINE', locked: false },
  ],
  milestones: [], validations: [],
};

/** Inbox de mentira: mostra o estado com que a página navegou de volta. */
function InboxEstado() {
  const state = useLocation().state as { atletaId?: string; tab?: string } | null;
  return <p>{`inbox ${state?.atletaId ?? '-'} ${state?.tab ?? '-'}`}</p>;
}

// MemoryRouter declarativo: o data router quebra a navegação no jsdom (AbortSignal); aqui não se testa href.
const montar = () => render(
  <MemoryRouter initialEntries={['/coach/athletes/a1/season/v2/adjust']}>
    <Routes>
      <Route path="/coach/athletes/:atletaId/season/:seasonPlanId/adjust" element={<CoachSeasonAdjustPage />} />
      <Route path="/coach/inbox" element={<InboxEstado />} />
    </Routes>
  </MemoryRouter>,
);

const apiError = (status: number, body: unknown) =>
  new ApiError({ method: 'POST', url: '' }, { url: '', ok: false, status, statusText: '', body }, 'erro');

describe('CoachSeasonAdjustPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SeasonPlanService.buscarPorId).mockResolvedValue(DRAFT);
    vi.mocked(SeasonPlanService.buscarDiff).mockResolvedValue([]);
  });

  it('aprovar exige motivo e confirmação; depois volta ao inbox na aba Temporada do atleta', async () => {
    vi.mocked(SeasonPlanService.aprovar).mockResolvedValue({ ...DRAFT, seasonStatus: 'ACTIVE' });
    montar();

    const aprovar = await screen.findByRole('button', { name: 'Aprovar nova versão' });
    expect(aprovar).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Motivo do ajuste/), 'Atleta gripou');
    await userEvent.click(aprovar);
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aprovar' }));

    expect(await screen.findByText('inbox a1 season')).toBeInTheDocument();
    expect(SeasonPlanService.aprovar).toHaveBeenCalledWith('a1', 'v2', 'Atleta gripou');
  });

  it('409 na aprovação mostra o conflito, mantém o motivo e não navega', async () => {
    vi.mocked(SeasonPlanService.aprovar).mockRejectedValue(apiError(409, { message: 'A temporada ativa mudou' }));
    montar();

    await userEvent.type(await screen.findByLabelText(/Motivo do ajuste/), 'Atleta gripou');
    await userEvent.click(screen.getByRole('button', { name: 'Aprovar nova versão' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aprovar' }));

    expect(await screen.findByText(/Este ajuste não pode mais ser aprovado/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText(/Motivo do ajuste/)).toHaveValue('Atleta gripou');
    expect(screen.getByRole('button', { name: 'Aprovar nova versão' })).toBeDisabled();
    expect(screen.queryByText(/^inbox/)).not.toBeInTheDocument();
  });

  it('"Descartar e recomeçar" abre o rascunho novo da ativa atual, com o motivo', async () => {
    vi.mocked(SeasonPlanService.aprovar).mockRejectedValue(apiError(409, { message: 'A temporada ativa mudou' }));
    vi.mocked(SeasonPlanService.descartar).mockResolvedValue(undefined);
    vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue({ ...DRAFT, id: 'v3', seasonStatus: 'ACTIVE', version: 3 });
    vi.mocked(SeasonPlanService.criarAjuste).mockResolvedValue({ ...DRAFT, id: 'v4', version: 4, baseSeasonPlanId: 'v3' });
    montar();
    await userEvent.type(await screen.findByLabelText(/Motivo do ajuste/), 'Atleta gripou');
    await userEvent.click(screen.getByRole('button', { name: 'Aprovar nova versão' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aprovar' }));
    vi.mocked(SeasonPlanService.buscarPorId).mockResolvedValue({ ...DRAFT, id: 'v4', version: 4, baseSeasonPlanId: 'v3' });

    await userEvent.click(await screen.findByRole('button', { name: 'Descartar e recomeçar' }));
    expect(SeasonPlanService.descartar).not.toHaveBeenCalled();
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Descartar e recomeçar' }));

    expect(await screen.findByText('Maratona SP · versão 4')).toBeInTheDocument();
    expect(SeasonPlanService.descartar).toHaveBeenCalledWith('a1', 'v2');
    expect(SeasonPlanService.buscarPorId).toHaveBeenLastCalledWith('a1', 'v4');
    expect(screen.queryByText(/Este ajuste não pode mais ser aprovado/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Motivo do ajuste/)).toHaveValue('Atleta gripou');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('mostra as alterações contra a ativa e o valor anterior na tabela', async () => {
    vi.mocked(SeasonPlanService.buscarDiff).mockResolvedValue([
      { weekIndex: 2, field: 'longRunKm', before: 10, after: 12, source: 'ENGINE' },
    ]);
    montar();

    const lista = await screen.findByRole('list', { name: 'Alterações' });
    expect(lista).toHaveTextContent('Semana 2 · Longão: 10,0 km → 12,0 km (motor)');
    expect(screen.getByTestId('adjust-week-2').querySelector('del')).toHaveTextContent('antes: 10,0 km');
  });

  it('recalcular pelos parâmetros troca o rascunho exibido', async () => {
    const prova = { weekIndex: 3, weekStart: '2026-11-30', phase: 'RACE_WEEK', targetVolumeKm: 20, targetTss: 150, deload: false,
      valueSource: 'ENGINE', locked: true, lockReason: 'RACE_WEEK' } as const;
    const tresSemanas = { ...DRAFT, totalWeeks: 3, initialVolumeKm: 38.5, weeks: [...DRAFT.weeks, prova] };
    vi.mocked(SeasonPlanService.buscarPorId).mockResolvedValue(tresSemanas);
    vi.mocked(SeasonPlanService.recalcular).mockResolvedValue({
      ...tresSemanas, weeks: [DRAFT.weeks[0], { ...DRAFT.weeks[1], targetVolumeKm: 44 }, prova],
    });
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Recalcular' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('O motor regenera a semana 2.');
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Recalcular' }));

    expect(await within(screen.getByTestId('adjust-week-2')).findByText('44,0 km')).toBeInTheDocument();
    expect(SeasonPlanService.recalcular).toHaveBeenCalledWith('a1', 'v2', {
      phaseWeeks: { BASE: 2, BUILD: 0, PEAK: 0, TAPER: 0 }, startVolumeKm: 38.5,
    });
    expect(SeasonPlanService.buscarDiff).toHaveBeenCalledTimes(2);
  });

  it('mudar a fase de uma semana pelo diálogo atualiza as contagens dos parâmetros', async () => {
    vi.mocked(SeasonPlanService.atualizarSemana).mockResolvedValue({
      ...DRAFT, weeks: [DRAFT.weeks[0], { ...DRAFT.weeks[1], phase: 'BUILD', valueSource: 'COACH' }],
    });
    montar();
    expect(await screen.findByLabelText('Base')).toHaveValue('2');

    await userEvent.click(screen.getByRole('button', { name: 'Editar semana 2' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.getByLabelText('Base')).toHaveValue('1'));
    expect(screen.getByLabelText('Construção')).toHaveValue('1');
  });

  it('descartar com confirmação volta ao inbox', async () => {
    vi.mocked(SeasonPlanService.descartar).mockResolvedValue(undefined);
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Descartar ajuste' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Descartar' }));

    expect(await screen.findByText('inbox a1 season')).toBeInTheDocument();
    expect(SeasonPlanService.descartar).toHaveBeenCalledWith('a1', 'v2');
  });

  it('ajuste já aprovado: aviso, sem edição nem aprovação', async () => {
    vi.mocked(SeasonPlanService.buscarPorId).mockResolvedValue({ ...DRAFT, seasonStatus: 'ACTIVE' });
    montar();

    expect(await screen.findByText(/já foi aprovado ou descartado/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar semana/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprovar nova versão' })).not.toBeInTheDocument();
  });

  it('falha ao carregar mostra o erro e o caminho de volta', async () => {
    vi.mocked(SeasonPlanService.buscarPorId).mockRejectedValue(apiError(404, { message: 'Temporada não encontrada' }));
    montar();

    expect(await screen.findByText('Temporada não encontrada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar para a temporada' })).toBeInTheDocument();
  });
});
