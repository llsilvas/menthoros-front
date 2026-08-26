import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineCheckIn } from './InlineCheckIn';
import { SELECAO_VAZIA } from '../adapters/inlineCheckinMapping';

describe('InlineCheckIn', () => {
  it('mostra cinco alvos com aria-pressed e o contador "N de 5" no primeiro check-in', () => {
    render(<InlineCheckIn selecao={{ ...SELECAO_VAZIA, qualidadeSono: 3 }} pendentes={4} salvo={false} salvando={false} error={null} onSelecionar={vi.fn()} onMaisDetalhes={vi.fn()} />);
    const alvos = screen.getAllByRole('button', { name: /sono|humor|dores|energia|estresse/i });
    expect(alvos).toHaveLength(5);
    expect(screen.getByRole('button', { name: /sono/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /humor/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('1 de 5')).toBeInTheDocument();
  });

  it('toque chama onSelecionar com a chave do item', async () => {
    const onSelecionar = vi.fn();
    render(<InlineCheckIn selecao={SELECAO_VAZIA} pendentes={5} salvo={false} salvando={false} error={null} onSelecionar={onSelecionar} onMaisDetalhes={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /energia/i }));
    expect(onSelecionar).toHaveBeenCalledWith('nivelEnergia');
  });

  it('salvo: mostra "Salvo" sem horário e o link para mais detalhes', async () => {
    const onMaisDetalhes = vi.fn();
    render(<InlineCheckIn selecao={{ qualidadeSono: 3, humor: 3, doresMusculares: 2, nivelEnergia: 3, estresse: 3 }} pendentes={0} salvo salvando={false} error={null} onSelecionar={vi.fn()} onMaisDetalhes={onMaisDetalhes} />);
    expect(screen.getByText('Salvo')).toBeInTheDocument();
    expect(screen.queryByText(/às/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /mais detalhes/i }));
    expect(onMaisDetalhes).toHaveBeenCalled();
  });

  it('erro aparece como alerta', () => {
    render(<InlineCheckIn selecao={SELECAO_VAZIA} pendentes={5} salvo={false} salvando={false} error={new Error('x')} onSelecionar={vi.fn()} onMaisDetalhes={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível salvar/i);
  });
});
