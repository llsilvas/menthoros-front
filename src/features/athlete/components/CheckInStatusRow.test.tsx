import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInStatusRow } from './CheckInStatusRow';

describe('CheckInStatusRow', () => {
  it('sem check-in: "Fazer check-in" chama onFazer', async () => {
    const onFazer = vi.fn();
    render(<CheckInStatusRow feito={false} onFazer={onFazer} onEditar={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /fazer check-in/i }));
    expect(onFazer).toHaveBeenCalled();
  });

  it('feito: mostra o estado sem horário e "Editar" chama onEditar', async () => {
    const onEditar = vi.fn();
    render(<CheckInStatusRow feito onFazer={vi.fn()} onEditar={onEditar} />);
    expect(screen.getByText(/check-in de hoje feito/i)).toBeInTheDocument();
    expect(screen.queryByText(/às/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEditar).toHaveBeenCalled();
  });
});
