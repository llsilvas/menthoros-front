import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttentionOnlyRow } from './AttentionOnlyRow';

describe('AttentionOnlyRow', () => {
  it('renderiza o motivo PROVA_ATLETA com o rótulo e a ação sugerida do backend', () => {
    render(
      <AttentionOnlyRow
        atletaId="a1"
        athleteName="Ana Silva"
        attention={{ severity: 'CRITICA', reason: 'PROVA_ATLETA', suggestedAction: 'Revise a prova e o plano das próximas semanas.', recencyDays: null }}
        selected={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Prova do atleta')).toBeInTheDocument();
    expect(screen.getByText(/revise a prova e o plano/i)).toBeInTheDocument();
  });
});
