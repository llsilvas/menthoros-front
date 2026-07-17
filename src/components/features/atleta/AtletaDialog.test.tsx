import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AtletaDialog from './AtletaDialog';

describe('AtletaDialog — dados de cobrança', () => {
  async function preencherCamposObrigatorios(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('Nome *'), 'Ana Silva');
    await user.type(screen.getByLabelText('Data de Nascimento *'), '1993-05-15');
    await user.type(screen.getByLabelText('Peso (kg) *'), '70');
    await user.type(screen.getByLabelText('Altura (cm) *'), '170');
    await user.type(screen.getByLabelText('Objetivo *'), 'Correr 10K');
  }

  it('preenche e salva tipoPlanoAtleta e dataVencimentoPlano com os valores corretos', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} />);

    await preencherCamposObrigatorios(user);

    await user.click(screen.getByRole('combobox', { name: /tipo de plano/i }));
    await user.click(await screen.findByRole('option', { name: 'Anual' }));

    await user.type(screen.getByLabelText('Vencimento do Plano'), '2026-08-15');

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoPlanoAtleta: 'ANUAL',
        dataVencimentoPlano: '2026-08-15',
      }),
    );
  });

  it('campos de cobrança vazios não bloqueiam o save (são opcionais)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} />);

    await preencherCamposObrigatorios(user);

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoPlanoAtleta: undefined,
        dataVencimentoPlano: undefined,
      }),
    );
  });
});
