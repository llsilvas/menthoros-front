import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttentionOnlyRow } from './AttentionOnlyRow';

describe('AttentionOnlyRow', () => {
  it('nome, contexto do sinal e aderência "—" (a fila não traz métricas)', () => {
    render(
      <AttentionOnlyRow
        atletaId="a1"
        athleteName="Ana Silva"
        attention={{ severity: 'CRITICA', reason: 'PROVA_ATLETA', suggestedAction: 'Revise a prova e o plano das próximas semanas.', recencyDays: 3, recencyKind: 'sinal' }}
        contexto={{ texto: 'Prova do atleta · sinal há 3 dias', tom: 'danger' }}
        selected={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /ana silva/i })).toBeInTheDocument();
    expect(screen.getByTestId('queue-row-motivo')).toHaveTextContent('Prova do atleta · sinal há 3 dias');
    expect(screen.getByTestId('queue-row-aderencia')).toHaveTextContent('—');
    expect(screen.queryByText(/revise a prova/i)).not.toBeInTheDocument();
  });

  it('selecionada marca aria-current', () => {
    render(
      <AttentionOnlyRow
        atletaId="a1"
        athleteName="Ana"
        attention={{ severity: 'MEDIA', reason: 'ADERENCIA', suggestedAction: 'x', recencyDays: null, recencyKind: 'sinal' }}
        contexto={{ texto: 'Aderência', tom: 'warning' }}
        selected
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /ana/i })).toHaveAttribute('aria-current', 'true');
  });
});
