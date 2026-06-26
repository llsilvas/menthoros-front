import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CoachDialog } from './CoachDialog';

describe('CoachDialog', () => {
  it('renderiza título e conteúdo quando aberto', () => {
    render(
      <CoachDialog open onClose={vi.fn()} title="Planos">
        <div>conteúdo</div>
      </CoachDialog>,
    );
    expect(screen.getByText('Planos')).toBeInTheDocument();
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('não renderiza nada quando fechado', () => {
    render(
      <CoachDialog open={false} onClose={vi.fn()} title="Planos">
        <div>conteúdo</div>
      </CoachDialog>,
    );
    expect(screen.queryByText('Planos')).not.toBeInTheDocument();
  });

  it('expõe nome acessível (aria-labelledby) e o headerAction', () => {
    render(
      <CoachDialog open onClose={vi.fn()} title="Diagnóstico" headerAction={<button>extra</button>}>
        <div>c</div>
      </CoachDialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Diagnóstico' })).toBeInTheDocument();
    expect(screen.getByText('extra')).toBeInTheDocument();
  });

  it('renderiza o rodapé de ações apenas quando fornecido', () => {
    const { rerender } = render(
      <CoachDialog open onClose={vi.fn()} title="X">
        <div>c</div>
      </CoachDialog>,
    );
    expect(screen.queryByText('Salvar')).not.toBeInTheDocument();

    rerender(
      <CoachDialog open onClose={vi.fn()} title="X" actions={<button>Salvar</button>}>
        <div>c</div>
      </CoachDialog>,
    );
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });
});
