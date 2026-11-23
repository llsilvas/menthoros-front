import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeasonParametersForm } from './SeasonParametersForm';
import type { SeasonWeek } from '../../../types/SeasonPlan';

const semana = (weekIndex: number, extra: Partial<SeasonWeek> = {}): SeasonWeek => ({
  weekIndex, weekStart: '2026-11-16', phase: 'BASE', targetVolumeKm: 40, targetTss: 300, deload: false,
  valueSource: 'ENGINE', locked: false, ...extra,
});

// 6 semanas: 1 concluída, 2 BASE livre, 3 BUILD editada pelo treinador, 4 PEAK, 5 TAPER, 6 da prova.
const WEEKS: SeasonWeek[] = [
  semana(1, { locked: true, lockReason: 'COMPLETED' }),
  semana(2),
  semana(3, { phase: 'BUILD', valueSource: 'COACH' }),
  semana(4, { phase: 'PEAK' }),
  semana(5, { phase: 'TAPER' }),
  semana(6, { phase: 'RACE_WEEK', locked: true, lockReason: 'RACE_WEEK' }),
];

const montar = (props: Partial<Parameters<typeof SeasonParametersForm>[0]> = {}) => {
  const onRecalculate = vi.fn().mockResolvedValue(true);
  render(<SeasonParametersForm weeks={WEEKS} totalWeeks={6} initialVolumeKm={38.5} recalculating={false}
    onRecalculate={onRecalculate} {...props} />);
  return onRecalculate;
};

const campo = (label: string) => screen.getByLabelText(label);
const recalcular = () => screen.getByRole('button', { name: 'Recalcular' });

describe('SeasonParametersForm', () => {
  it('pré-preenche as fases pelo rascunho e o volume de partida', () => {
    montar();

    expect(campo('Base')).toHaveValue('2');
    expect(campo('Construção')).toHaveValue('1');
    expect(campo('Pico')).toHaveValue('1');
    expect(campo('Polimento')).toHaveValue('1');
    expect(campo('Volume de partida (km)')).toHaveValue('38,5');
    expect(screen.getByRole('status')).toHaveTextContent('Soma: 6 semanas com a da prova, igual ao ciclo.');
    expect(recalcular()).toBeEnabled();
  });

  it('soma divergente mostra a diferença e desabilita o recálculo', async () => {
    montar();

    await userEvent.clear(campo('Base'));
    await userEvent.type(campo('Base'), '4');

    expect(screen.getByRole('status')).toHaveTextContent('Soma: 8 semanas com a da prova; o ciclo tem 6. Tire 2 semanas.');
    expect(recalcular()).toBeDisabled();
  });

  it('sem volume de partida (temporada anterior à V121) o campo começa vazio e o recálculo fica desabilitado', () => {
    montar({ initialVolumeKm: undefined });

    expect(campo('Volume de partida (km)')).toHaveValue('');
    expect(recalcular()).toBeDisabled();
  });

  it('volume com duas casas desabilita o recálculo', async () => {
    montar();

    await userEvent.clear(campo('Volume de partida (km)'));
    await userEvent.type(campo('Volume de partida (km)'), '40,55');

    expect(recalcular()).toBeDisabled();
  });

  it('a confirmação lista as semanas regeneradas e as preservadas; confirmar manda os parâmetros', async () => {
    const onRecalculate = montar();

    await userEvent.clear(campo('Volume de partida (km)'));
    await userEvent.type(campo('Volume de partida (km)'), '40');
    await userEvent.click(recalcular());
    const dialogo = screen.getByRole('dialog');

    expect(dialogo).toHaveTextContent('O motor regenera as semanas 2, 4 e 5.');
    expect(dialogo).toHaveTextContent('A semana editada por você (3) fica como está.');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Recalcular' }));

    expect(onRecalculate).toHaveBeenCalledWith({ phaseWeeks: { BASE: 2, BUILD: 1, PEAK: 1, TAPER: 1 }, startVolumeKm: 40 });
  });

  it('422 do recálculo aparece na confirmação, que continua aberta', async () => {
    montar({ error: 'O recálculo mudaria a fase da semana 1', onRecalculate: vi.fn().mockResolvedValue(false) });

    await userEvent.click(recalcular());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Recalcular' }));

    expect(within(screen.getByRole('dialog')).getByText('O recálculo mudaria a fase da semana 1')).toBeInTheDocument();
  });
});
