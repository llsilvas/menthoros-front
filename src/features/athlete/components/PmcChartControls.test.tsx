import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PmcChartControls } from './PmcChartControls';

describe('PmcChartControls', () => {
  it('por padrão oferece só 4s, 8s e 12s — a série do backend cobre 90 dias', () => {
    render(<PmcChartControls mode="advanced" onModeChange={vi.fn()} range="12w" onRangeChange={vi.fn()} />);

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Simples', 'Avançado', '4s', '8s', '12s']);
  });

  it('marca o ativo e avisa o pai na troca', async () => {
    const onModeChange = vi.fn();
    const onRangeChange = vi.fn();
    render(<PmcChartControls mode="advanced" onModeChange={onModeChange} range="12w" onRangeChange={onRangeChange} />);

    expect(screen.getByRole('button', { name: 'Avançado' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Simples' }));
    await userEvent.click(screen.getByRole('button', { name: '4s' }));
    expect(onModeChange).toHaveBeenCalledWith('simple');
    expect(onRangeChange).toHaveBeenCalledWith('4w');
  });
});
