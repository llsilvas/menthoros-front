import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickCheckInModal } from './QuickCheckInModal';

describe('QuickCheckInModal', () => {
  it('renderiza os 5 sliders do contrato com os ranges corretos', () => {
    render(<QuickCheckInModal open onClose={vi.fn()} onSubmit={vi.fn()} />);

    const qualidadeSono = screen.getByRole('slider', { name: /qualidade do sono/i });
    expect(qualidadeSono).toHaveAttribute('aria-valuemin', '1');
    expect(qualidadeSono).toHaveAttribute('aria-valuemax', '10');

    const humor = screen.getByRole('slider', { name: /^humor$/i });
    expect(humor).toHaveAttribute('aria-valuemin', '1');
    expect(humor).toHaveAttribute('aria-valuemax', '10');

    const doresMusculares = screen.getByRole('slider', { name: /dores musculares/i });
    expect(doresMusculares).toHaveAttribute('aria-valuemin', '0');
    expect(doresMusculares).toHaveAttribute('aria-valuemax', '10');

    const nivelEnergia = screen.getByRole('slider', { name: /nível de energia/i });
    expect(nivelEnergia).toHaveAttribute('aria-valuemin', '1');
    expect(nivelEnergia).toHaveAttribute('aria-valuemax', '10');

    const estresse = screen.getByRole('slider', { name: /estresse/i });
    expect(estresse).toHaveAttribute('aria-valuemin', '0');
    expect(estresse).toHaveAttribute('aria-valuemax', '10');
  });

  it('submete os 5 campos + observações mapeados 1:1 para o contrato do backend', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<QuickCheckInModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/algo a registrar/i), 'Dormi mal');
    await user.click(screen.getByRole('button', { name: /registrar/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        qualidadeSono: expect.any(Number),
        humor: expect.any(Number),
        doresMusculares: expect.any(Number),
        nivelEnergia: expect.any(Number),
        estresse: expect.any(Number),
        observacoes: 'Dormi mal',
      }),
    );
  });

  it('omite observacoes quando vazio, sem fabricar string vazia', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<QuickCheckInModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /registrar/i }));

    expect(onSubmit.mock.calls[0][0].observacoes).toBeUndefined();
  });

  it('pré-preenche os campos quando initialData é passado (edição do check-in de hoje)', () => {
    render(
      <QuickCheckInModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={{ qualidadeSono: 8, humor: 7, doresMusculares: 2, nivelEnergia: 6, estresse: 3, observacoes: 'Tudo bem' }}
      />,
    );

    expect(screen.getByRole('slider', { name: /qualidade do sono/i })).toHaveAttribute('aria-valuenow', '8');
    expect(screen.getByDisplayValue('Tudo bem')).toBeInTheDocument();
  });

  it('chama onClose ao clicar em Pular, sem submeter', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QuickCheckInModal open onClose={onClose} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /pular/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('mostra o erro inline com "Tentar novamente" quando onSubmit falha, sem fechar/resetar', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QuickCheckInModal open onClose={onClose} onSubmit={onSubmit} error="Não foi possível salvar." />);

    await user.type(screen.getByLabelText(/algo a registrar/i), 'Minha nota');
    await user.click(screen.getByRole('button', { name: /registrar/i }));

    expect(await screen.findByText('Não foi possível salvar.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    // dado preenchido não é resetado ao falhar — usuário não perde o que digitou
    expect(screen.getByDisplayValue('Minha nota')).toBeInTheDocument();
  });

  it('desabilita o botão Registrar e mostra estado de envio enquanto submitting=true', () => {
    render(<QuickCheckInModal open onClose={vi.fn()} onSubmit={vi.fn()} submitting />);

    expect(screen.getByRole('button', { name: /registrando/i })).toBeDisabled();
  });
});
