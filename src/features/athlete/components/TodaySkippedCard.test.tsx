import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodaySkippedCard } from './TodaySkippedCard';

describe('TodaySkippedCard', () => {
  it('mostra o motivo quando presente e "Registrar mesmo assim" navega ao clicar', async () => {
    const onRegister = vi.fn();
    render(<TodaySkippedCard motivoPulo="DOR" onRegister={onRegister} />);
    expect(screen.getByText(/hoje você pulou/i)).toBeInTheDocument();
    expect(screen.getByText(/dor/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /registrar mesmo assim/i }));
    expect(onRegister).toHaveBeenCalled();
  });

  it('sem motivo: não inventa um', () => {
    render(<TodaySkippedCard onRegister={vi.fn()} />);
    expect(screen.getByText(/hoje você pulou/i)).toBeInTheDocument();
  });
});
