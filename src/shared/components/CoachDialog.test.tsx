import { fireEvent, render, screen } from '@testing-library/react';
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

  it('renderiza chip, subtitle e dica do rodapé quando fornecidos', () => {
    render(
      <CoachDialog
        open
        onClose={vi.fn()}
        title="Gerar Projeção"
        chip={<span>Projeção de Prova</span>}
        subtitle="Pipeline de 3 camadas"
        actions={<button>Gerar</button>}
        actionsHint={<span>~2-5s</span>}
      >
        <div>c</div>
      </CoachDialog>,
    );
    expect(screen.getByText('Projeção de Prova')).toBeInTheDocument();
    expect(screen.getByText('Pipeline de 3 camadas')).toBeInTheDocument();
    expect(screen.getByText('~2-5s')).toBeInTheDocument();
  });

  it('aciona onClose pelo botão de fechar e o oculta com showClose=false', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <CoachDialog open onClose={onClose} title="X">
        <div>c</div>
      </CoachDialog>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <CoachDialog open onClose={onClose} title="X" showClose={false}>
        <div>c</div>
      </CoachDialog>,
    );
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();
  });

  it('dispara onSubmit quando renderizado como form', () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <CoachDialog open onClose={vi.fn()} title="X" component="form" onSubmit={onSubmit} actions={<button type="submit">Enviar</button>}>
        <div>c</div>
      </CoachDialog>,
    );
    fireEvent.click(screen.getByText('Enviar'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
