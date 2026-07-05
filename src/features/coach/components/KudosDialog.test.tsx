import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KudosDialog } from './KudosDialog';

describe('KudosDialog', () => {
  it('submete o motivo default (Consistência) ao confirmar sem trocar a seleção', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<KudosDialog open onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /reconhecer$/i }));

    expect(onSubmit).toHaveBeenCalledWith('CONSISTENCIA');
  });

  it('permite trocar o motivo antes de confirmar', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<KudosDialog open onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Esforço' }));
    await user.click(screen.getByRole('button', { name: /reconhecer$/i }));

    expect(onSubmit).toHaveBeenCalledWith('ESFORCO');
  });

  it('chama onClose ao clicar em Cancelar, sem submeter', async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<KudosDialog open onClose={onClose} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('mostra o erro inline quando onSubmit falha, sem fechar', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<KudosDialog open onClose={onClose} onSubmit={onSubmit} error="Você já reconheceu isso hoje." />);

    await user.click(screen.getByRole('button', { name: /reconhecer$/i }));

    expect(screen.getByText('Você já reconheceu isso hoje.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('desabilita os botões enquanto submitting=true', () => {
    render(<KudosDialog open onClose={vi.fn()} onSubmit={vi.fn()} submitting />);

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });

  it('reseta o motivo para o default ao reabrir (achado do Codex review: dialog não desmonta)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { rerender } = render(<KudosDialog open onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Esforço' }));

    // fecha (mesmo componente permanece montado) e reabre
    rerender(<KudosDialog open={false} onClose={vi.fn()} onSubmit={onSubmit} />);
    rerender(<KudosDialog open onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /reconhecer$/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('CONSISTENCIA'));
  });
});
