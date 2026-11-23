import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeasonAdjustTable } from './SeasonAdjustTable';
import type { SeasonWeek } from '../../../types/SeasonPlan';

const WEEKS: SeasonWeek[] = [
  { weekIndex: 1, weekStart: '2026-11-09', phase: 'BASE', targetVolumeKm: 38, targetTss: 280, deload: false, longRunKm: 10, valueSource: 'ENGINE', locked: true, lockReason: 'COMPLETED' },
  { weekIndex: 2, weekStart: '2026-11-16', phase: 'BASE', targetVolumeKm: 40, targetTss: 300, deload: false, longRunKm: 11, valueSource: 'ENGINE', locked: true, lockReason: 'IN_PROGRESS' },
  { weekIndex: 3, weekStart: '2026-11-23', phase: 'BUILD', targetVolumeKm: 42, targetTss: 310, deload: false, longRunKm: 12, valueSource: 'ENGINE', locked: false, keySessions: '5x1km' },
  { weekIndex: 4, weekStart: '2026-11-30', phase: 'RACE_WEEK', targetVolumeKm: 20, targetTss: 150, deload: false, valueSource: 'ENGINE', locked: true, lockReason: 'RACE_WEEK' },
];

const linha = (n: number) => screen.getByTestId(`adjust-week-${n}`);

describe('SeasonAdjustTable', () => {
  it('semanas travadas mostram o motivo e não têm edição', () => {
    render(<SeasonAdjustTable weeks={WEEKS} savingWeek={null} onSaveWeek={vi.fn()} />);

    expect(linha(1)).toHaveTextContent('Concluída');
    expect(linha(2)).toHaveTextContent('Em andamento');
    expect(linha(4)).toHaveTextContent('Semana da prova');
    expect(screen.queryByRole('button', { name: 'Editar semana 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar semana 3' })).toBeInTheDocument();
  });

  it('editar uma semana futura e salvar manda os valores lidos com vírgula e fecha a edição', async () => {
    const onSaveWeek = vi.fn().mockResolvedValue(true);
    render(<SeasonAdjustTable weeks={WEEKS} savingWeek={null} onSaveWeek={onSaveWeek} />);

    await userEvent.click(screen.getByRole('button', { name: 'Editar semana 3' }));
    const volume = within(linha(3)).getByLabelText('Volume (km)');
    await userEvent.clear(volume);
    await userEvent.type(volume, '45,5');
    const sessoes = within(linha(3)).getByLabelText('Sessões-chave');
    await userEvent.clear(sessoes);
    await userEvent.type(sessoes, ' 6x1km ');
    await userEvent.click(within(linha(3)).getByRole('checkbox', { name: 'Descarga' }));
    await userEvent.click(within(linha(3)).getByRole('button', { name: 'Salvar' }));

    expect(onSaveWeek).toHaveBeenCalledWith(3, {
      phase: 'BUILD', targetVolumeKm: 45.5, longRunKm: 12, targetTss: 310, deload: true, keySessions: '6x1km',
    });
    expect(await screen.findByRole('button', { name: 'Editar semana 3' })).toBeInTheDocument();
  });

  it('valor negativo bloqueia o salvar', async () => {
    const onSaveWeek = vi.fn();
    render(<SeasonAdjustTable weeks={WEEKS} savingWeek={null} onSaveWeek={onSaveWeek} />);

    await userEvent.click(screen.getByRole('button', { name: 'Editar semana 3' }));
    const longao = within(linha(3)).getByLabelText('Longão (km)');
    await userEvent.clear(longao);
    await userEvent.type(longao, '-2');

    expect(within(linha(3)).getByRole('button', { name: 'Salvar' })).toBeDisabled();
    expect(onSaveWeek).not.toHaveBeenCalled();
  });

  it('falha ao salvar mantém a edição aberta', async () => {
    const onSaveWeek = vi.fn().mockResolvedValue(false);
    render(<SeasonAdjustTable weeks={WEEKS} savingWeek={null} onSaveWeek={onSaveWeek} />);

    await userEvent.click(screen.getByRole('button', { name: 'Editar semana 3' }));
    await userEvent.click(within(linha(3)).getByRole('button', { name: 'Salvar' }));

    expect(within(linha(3)).getByLabelText('Volume (km)')).toBeInTheDocument();
  });
});
