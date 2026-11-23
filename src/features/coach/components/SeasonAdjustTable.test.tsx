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

  it('somente leitura não oferece edição nem nas semanas livres', () => {
    render(<SeasonAdjustTable weeks={WEEKS} savingWeek={null} readOnly onSaveWeek={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Editar semana/ })).not.toBeInTheDocument();
  });

  it('editar abre o diálogo com foco no volume; salvar manda os valores e fecha', async () => {
    const onSaveWeek = vi.fn().mockResolvedValue(true);
    render(<SeasonAdjustTable weeks={WEEKS} savingWeek={null} onSaveWeek={onSaveWeek} />);

    await userEvent.click(screen.getByRole('button', { name: 'Editar semana 3' }));
    const dialogo = screen.getByRole('dialog');
    const volume = within(dialogo).getByLabelText(/Volume \(km\)/);
    expect(volume).toHaveFocus();
    await userEvent.clear(volume);
    await userEvent.type(volume, '45,5');
    const sessoes = within(dialogo).getByLabelText('Sessões-chave');
    await userEvent.clear(sessoes);
    await userEvent.type(sessoes, ' 6x1km ');
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: 'Semana de descarga' }));
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }));

    expect(onSaveWeek).toHaveBeenCalledWith(3, {
      phase: 'BUILD', targetVolumeKm: 45.5, longRunKm: 12, targetTss: 310, deload: true, keySessions: '6x1km',
    });
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('campo vazio ou negativo bloqueia o salvar com a mensagem', async () => {
    render(<SeasonAdjustTable weeks={WEEKS} savingWeek={null} onSaveWeek={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Editar semana 3' }));
    const dialogo = screen.getByRole('dialog');
    await userEvent.clear(within(dialogo).getByLabelText(/Longão \(km\)/));

    expect(within(dialogo).getByRole('button', { name: 'Salvar' })).toBeDisabled();
    expect(within(dialogo).getByText('Informe um número maior ou igual a zero')).toBeInTheDocument();
  });

  it('falha ao salvar mantém o diálogo aberto com o erro; fechar avisa a página', async () => {
    const onCloseEdit = vi.fn();
    const onSaveWeek = vi.fn().mockResolvedValue(false);
    const { rerender } = render(<SeasonAdjustTable weeks={WEEKS} savingWeek={null} onSaveWeek={onSaveWeek} onCloseEdit={onCloseEdit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Editar semana 3' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Salvar' }));
    rerender(<SeasonAdjustTable weeks={WEEKS} savingWeek={null} saveError="A semana 3 é a da prova-alvo" onSaveWeek={onSaveWeek} onCloseEdit={onCloseEdit} />);

    expect(within(screen.getByRole('dialog')).getByText('A semana 3 é a da prova-alvo')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    expect(onCloseEdit).toHaveBeenCalled();
  });
});
