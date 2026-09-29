import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, startOfDay, subDays } from 'date-fns';
import { PMCChart } from './PMCChart';
import type { PMCDataPoint } from './PMCChart';

function serie(dias: number): PMCDataPoint[] {
  const inicio = subDays(startOfDay(new Date()), dias - 1);
  return Array.from({ length: dias }, (_, i) => ({
    date: addDays(inicio, i),
    tss: 50,
    ctl: 40,
    atl: 45,
    tsb: -5,
    statusForma: 'RECUPERANDO' as const,
  }));
}

describe('PMCChart', () => {
  it('oferece só os períodos cobertos pela série padrão do backend (90 dias)', () => {
    render(<PMCChart data={serie(90)} range="12w" />);

    for (const label of ['4s', '8s', '12s']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: '6m' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1a' })).not.toBeInTheDocument();
  });

  it('troca de período avisa o pai', async () => {
    const onRangeChange = vi.fn();
    render(<PMCChart data={serie(90)} range="12w" onRangeChange={onRangeChange} />);

    await userEvent.click(screen.getByRole('button', { name: '4s' }));

    expect(onRangeChange).toHaveBeenCalledWith('4w');
    expect(screen.getByRole('button', { name: '4s' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('modo avançado mostra a legenda com o valor atual de cada série', () => {
    render(<PMCChart data={serie(30)} range="4w" defaultMode="advanced" />);

    expect(screen.getByText('Condicionamento')).toBeInTheDocument();
    expect(screen.getByText('Cansaço')).toBeInTheDocument();
    expect(screen.getByText('Forma')).toBeInTheDocument();
    expect(screen.getByText('40,0')).toBeInTheDocument();
    expect(screen.getByText('-5,0')).toBeInTheDocument();
  });

  it('fora do diagnóstico mantém título, seletor e modos (telas do atleta)', () => {
    render(<PMCChart data={serie(90)} range="12w" />);

    expect(screen.getByText('Desempenho')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simples' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avançado' })).toBeInTheDocument();
  });

  it('embutido num SectionCard não repete o título', () => {
    render(<PMCChart data={serie(90)} range="12w" embedded />);

    expect(screen.queryByText('Desempenho')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avançado' })).toBeInTheDocument();
  });

  it('consulta que falhou mostra "Dado indisponível", não um gráfico vazio', () => {
    render(<PMCChart data={[]} range="12w" unavailable />);

    expect(screen.getByText('Dado indisponível')).toBeInTheDocument();
  });
});
