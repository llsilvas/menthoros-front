import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttentionOnlyRow } from './AttentionOnlyRow';

describe('AttentionOnlyRow', () => {
  it('nome, contexto do sinal e aderência "—" (a fila não traz métricas)', () => {
    render(
      <AttentionOnlyRow
        atletaId="a1"
        athleteName="Ana Silva"
        contexto={{ texto: 'Prova do atleta · sinal há 3 dias', tom: 'danger' }}
        selected={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /ana silva/i })).toBeInTheDocument();
    expect(screen.getByTestId('queue-row-motivo')).toHaveTextContent('Prova do atleta · sinal há 3 dias');
    expect(screen.getByTestId('queue-row-aderencia')).toHaveTextContent(/^Ader\. —$/);
  });

  it('selecionada marca aria-current', () => {
    render(
      <AttentionOnlyRow
        atletaId="a1"
        athleteName="Ana"
        contexto={{ texto: 'Aderência', tom: 'warning' }}
        selected
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /ana/i })).toHaveAttribute('aria-current', 'true');
  });
});
