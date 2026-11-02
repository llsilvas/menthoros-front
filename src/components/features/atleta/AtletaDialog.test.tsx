import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AtletaDialog from './AtletaDialog';
import type { Atleta } from '../../../types/Atleta';

function atletaCadastrado(extra: Partial<Atleta> = {}): Atleta {
  return {
    id: 'a1',
    nome: 'Ana Silva',
    dataNascimento: '1993-05-15',
    pesoKg: 70,
    alturaCm: 170,
    objetivo: 'Correr 10K',
    nivelExperiencia: 'INTERMEDIARIO',
    diasDisponiveis: ['SEGUNDA', 'QUARTA'],
    temLesao: false,
    ...extra,
  } as Atleta;
}

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

  describe('edição — data de nascimento', () => {
    it('abre com a data cadastrada preenchida', () => {
      render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} atleta={atletaCadastrado()} />);

      expect(screen.getByLabelText('Data de Nascimento *')).toHaveValue('1993-05-15');
    });

    it('editar só o objetivo e salvar envia a data original, sem redigitar', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} atleta={atletaCadastrado()} />);

      const objetivo = screen.getByLabelText('Objetivo *');
      await user.clear(objetivo);
      await user.type(objetivo, 'Meia maratona');
      await user.click(screen.getByRole('button', { name: /salvar/i }));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ dataNascimento: '1993-05-15', objetivo: 'Meia maratona' }),
      );
    });

    it('atleta legado sem data abre vazio e bloqueia o salvamento', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      const legado = atletaCadastrado({ dataNascimento: undefined as unknown as string });
      render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} atleta={legado} />);

      expect(screen.getByLabelText('Data de Nascimento *')).toHaveValue('');
      await user.click(screen.getByRole('button', { name: /salvar/i }));

      expect(await screen.findByText('Data de nascimento é obrigatória')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
