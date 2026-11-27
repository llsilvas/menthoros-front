import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeasonWeekEditDialog } from './SeasonWeekEditDialog';
import type { SeasonWeek, TrainingPhase } from '../../../types/SeasonPlan';

/** Âncora na semana 2 (Base, 13,0 km, TSS 122), subida até a 13 (16,2 km), COACH na 9, prova travada na 15. */
const semana = (i: number): SeasonWeek => {
  const phase: TrainingPhase = i <= 7 ? 'BASE' : i <= 10 ? 'BUILD' : i <= 13 ? 'PEAK' : i === 14 ? 'TAPER' : 'RACE_WEEK';
  return {
    weekIndex: i, weekStart: '2026-11-23', phase, targetVolumeKm: i === 13 ? 16.2 : i === 3 ? 13.4 : 13, targetTss: 122,
    deload: i === 4 || i === 8, longRunKm: 4, valueSource: i === 9 ? 'COACH' : 'ENGINE', locked: i === 1 || i === 15,
  };
};
const CICLO = Array.from({ length: 15 }, (_, k) => semana(k + 1));

const abrir = (onSave = vi.fn().mockResolvedValue(true)) => {
  render(<SeasonWeekEditDialog week={CICLO[1]} weeks={CICLO} saving={false} onClose={vi.fn()} onSave={onSave} />);
  return onSave;
};
const campo = (label: RegExp) => screen.getByLabelText(label);
const digitar = async (label: RegExp, texto: string) => {
  await userEvent.clear(campo(label));
  await userEvent.type(campo(label), texto);
};
const recalcular = () => screen.queryByRole('radio', { name: /Recalcular as semanas seguintes/ });

describe('SeasonWeekEditDialog', () => {
  it('volume novo preenche o TSS na proporção e envia esse valor, sem pico', async () => {
    const onSave = abrir();

    await digitar(/Volume \(km\)/, '20,0');
    expect(campo(/^TSS/)).toHaveValue('188');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ targetVolumeKm: 20, targetTss: 188 }));
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('followingPeakVolumeKm');
  });

  it('TSS editado pelo treinador não muda mais com o volume', async () => {
    abrir();

    await digitar(/^TSS/, '150');
    await digitar(/Volume \(km\)/, '20');

    expect(campo(/^TSS/)).toHaveValue('150');
  });

  it('só esta semana é o padrão e mostra a semana seguinte como fica', () => {
    abrir();

    expect(screen.getByRole('radio', { name: /Só esta semana/ })).toBeChecked();
    expect(screen.getByText('A semana 3 continua em 13,4 km')).toBeInTheDocument();
  });

  it('recalcular mostra as consequências, o pico atual e o sugerido pela proporção', async () => {
    abrir();

    await digitar(/Volume \(km\)/, '20');
    await userEvent.click(recalcular()!);

    expect(screen.getByText(/Reescreve 11 semanas; 2 ficam como estão/)).toBeInTheDocument();
    expect(campo(/Volume de pico \(km\)/)).toHaveValue('24.9');
    expect(screen.getByText('hoje 16,2 km')).toBeInTheDocument();
  });

  it('redução do volume deixa o pico vazio', async () => {
    abrir();

    await digitar(/Volume \(km\)/, '10');
    await userEvent.click(recalcular()!);

    expect(campo(/Volume de pico \(km\)/)).toHaveValue('');
  });

  it('pico menor que o volume desabilita o salvar com mensagem', async () => {
    abrir();

    await digitar(/Volume \(km\)/, '20');
    await userEvent.click(recalcular()!);
    await digitar(/Volume de pico \(km\)/, '19');

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    expect(screen.getByText('O pico precisa ser maior ou igual ao volume da semana')).toBeInTheDocument();
  });

  it('com recalcular marcado envia o pico', async () => {
    const onSave = abrir();

    await digitar(/Volume \(km\)/, '20');
    await userEvent.click(recalcular()!);
    await digitar(/Volume de pico \(km\)/, '30');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ targetVolumeKm: 20, followingPeakVolumeKm: 30 }));
  });

  it('descarga marcada no formulário esconde a opção de recalcular', async () => {
    abrir();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Semana de descarga' }));

    expect(recalcular()).not.toBeInTheDocument();
  });
});
