import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AtletaDialog from './AtletaDialog';

describe('AtletaDialog', () => {
  async function preencherCamposObrigatorios(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('Nome *'), 'Ana Silva');
    await user.type(screen.getByLabelText('Data de Nascimento *'), '1993-05-15');
    await user.type(screen.getByLabelText('Peso (kg) *'), '70');
    await user.type(screen.getByLabelText('Altura (cm) *'), '170');
    await user.type(screen.getByLabelText('Objetivo *'), 'Correr 10K');
  }

  it('não renderiza mais os campos de plano/vencimento (CA15 — contrato move para CobrancaAtletaSection)', () => {
    render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.queryByRole('combobox', { name: /tipo de plano/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/vencimento do plano/i)).not.toBeInTheDocument();
  });

  it('salva sem enviar tipoPlanoAtleta/dataVencimentoPlano', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} />);

    await preencherCamposObrigatorios(user);
    await user.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.not.objectContaining({
        tipoPlanoAtleta: expect.anything(),
        dataVencimentoPlano: expect.anything(),
      }),
    );
  });
});
