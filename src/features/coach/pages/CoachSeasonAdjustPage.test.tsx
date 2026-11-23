import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

  it('409 na aprovação fica no diálogo e não navega', async () => {
    vi.mocked(SeasonPlanService.aprovar).mockRejectedValue(apiError(409, { message: 'A temporada ativa mudou' }));
    montar();

    await userEvent.type(await screen.findByLabelText(/Motivo do ajuste/), 'Ajuste');
    await userEvent.click(screen.getByRole('button', { name: 'Aprovar nova versão' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aprovar' }));

    expect(await within(screen.getByRole('dialog')).findByText('A temporada ativa mudou')).toBeInTheDocument();
    expect(screen.queryByText(/^inbox/)).not.toBeInTheDocument();
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
