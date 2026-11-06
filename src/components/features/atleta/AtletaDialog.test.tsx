import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AtletaDialog from './AtletaDialog';
import type { Atleta } from '../../../types/Atleta';

function atletaCadastrado(extra: Partial<Atleta> = {}): Atleta {
  return {
    id: 'a1',
    nome: 'Ana Silva',
    dataNascimento: '1993-05-15',
    sexo: 'FEMININO',
    pesoKg: 70,
    alturaCm: 170,
    objetivo: 'Correr 10K',
    nivelExperiencia: 'AVANCADO',
    diasDisponiveis: ['SEGUNDA', 'QUARTA'],
    diaPreferidoLongo: 'QUARTA',
    temLesao: false,
    ...extra,
  } as Atleta;
}

type User = ReturnType<typeof userEvent.setup>;

const salvar = () => screen.getByRole('button', { name: /adicionar atleta|salvar alterações/i });
const chip = (label: string) => screen.getByRole('button', { name: label });
// Select do MUI vazio renderiza um espaço de largura zero; o valor real fica no input oculto
const valorSelect = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value;

async function escolher(user: User, campo: RegExp, opcao: string) {
  await user.click(screen.getByRole('combobox', { name: campo }));
  await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: opcao }));
}

async function preencherCadastroCompleto(user: User) {
  await user.type(screen.getByLabelText('Nome *'), 'Ana Silva');
  await user.type(screen.getByLabelText('Data de nascimento *'), '1993-05-15');
  await escolher(user, /sexo/i, 'Feminino');
  await user.type(screen.getByLabelText('Peso *'), '70');
  await user.type(screen.getByLabelText('Altura *'), '170');
  await user.type(screen.getByLabelText('Objetivo *'), 'Correr 10K');
  await escolher(user, /nível de experiência/i, 'Intermediário');
  await user.click(chip('Terça'));
  await escolher(user, /dia do treino longo/i, 'Terça');
}

describe('AtletaDialog', () => {
  it('não renderiza mais os campos de plano/vencimento (CA15 — contrato move para CobrancaAtletaSection)', () => {
    render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.queryByRole('combobox', { name: /tipo de plano/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/vencimento do plano/i)).not.toBeInTheDocument();
  });

  it('salva sem enviar tipoPlanoAtleta/dataVencimentoPlano', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} />);

    await preencherCadastroCompleto(user);
    await user.click(salvar());

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

      expect(screen.getByLabelText('Data de nascimento *')).toHaveValue('1993-05-15');
    });

    it('editar só o objetivo e salvar envia a data original, sem redigitar', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} atleta={atletaCadastrado()} />);

      const objetivo = screen.getByLabelText('Objetivo *');
      await user.clear(objetivo);
      await user.type(objetivo, 'Meia maratona');
      await user.click(salvar());

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ dataNascimento: '1993-05-15', objetivo: 'Meia maratona' }),
      );
    });

    it('atleta legado sem data abre vazio e bloqueia o salvamento', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      const legado = atletaCadastrado({ dataNascimento: undefined as unknown as string });
      render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} atleta={legado} />);

      expect(screen.getByLabelText('Data de nascimento *')).toHaveValue('');
      await user.click(salvar());

      expect(await screen.findByText('Data de nascimento é obrigatória')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('cadastro — campos de escolha sem default', () => {
    it('abre com sexo, nível, longão, peso e altura vazios', () => {
      render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} />);

      expect(valorSelect('sexo')).toBe('');
      expect(valorSelect('nivelExperiencia')).toBe('');
      expect(valorSelect('diaPreferidoLongo')).toBe('');
      expect(screen.getByLabelText('Peso *')).toHaveValue('');
      expect(screen.getByLabelText('Altura *')).toHaveValue('');
    });

    it('salvar sem escolher mostra erro em cada campo e não chama onSave', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} />);

      await user.type(screen.getByLabelText('Nome *'), 'Ana Silva');
      await user.type(screen.getByLabelText('Data de nascimento *'), '1993-05-15');
      await user.type(screen.getByLabelText('Objetivo *'), 'Correr 10K');
      await user.click(salvar());

      expect(await screen.findByText('Escolha o sexo')).toBeInTheDocument();
      expect(screen.getByText('Escolha o nível de experiência')).toBeInTheDocument();
      expect(screen.getByText('Escolha o dia do treino longo')).toBeInTheDocument();
      expect(screen.getByText('Informe o peso')).toBeInTheDocument();
      expect(screen.getByText('Informe a altura')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('edição abre com as escolhas do cadastro', () => {
      render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} atleta={atletaCadastrado()} />);

      expect(screen.getByRole('combobox', { name: /sexo/i })).toHaveTextContent('Feminino');
      expect(screen.getByRole('combobox', { name: /nível de experiência/i })).toHaveTextContent('Avançado');
      expect(screen.getByRole('combobox', { name: /dia do treino longo/i })).toHaveTextContent('Quarta');
      expect(screen.getByLabelText('Peso *')).toHaveValue('70');
    });
  });

  describe('peso e altura', () => {
    it('aceita vírgula e envia número', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} />);

      await preencherCadastroCompleto(user);
      await user.clear(screen.getByLabelText('Peso *'));
      await user.type(screen.getByLabelText('Peso *'), '72,5');
      await user.click(salvar());

      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ pesoKg: 72.5, alturaCm: 170 }));
    });

    it('zero bloqueia', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} />);

      await preencherCadastroCompleto(user);
      await user.clear(screen.getByLabelText('Peso *'));
      await user.type(screen.getByLabelText('Peso *'), '0');
      await user.click(salvar());

      expect(await screen.findByText('Informe o peso')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('dias disponíveis e dia do longão', () => {
    it('sem dia marcado o longão fica desabilitado', () => {
      render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} />);

      expect(screen.getByRole('combobox', { name: /dia do treino longo/i })).toHaveAttribute('aria-disabled', 'true');
    });

    it('oferece só os dias marcados, com acento', async () => {
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} />);

      await user.click(chip('Terça'));
      await user.click(chip('Sábado'));
      await user.click(screen.getByRole('combobox', { name: /dia do treino longo/i }));

      const opcoes = within(screen.getByRole('listbox')).getAllByRole('option').map(o => o.textContent);
      expect(opcoes).toEqual(['Terça', 'Sábado']);
    });

    it('desmarcar o dia do longão limpa a escolha', async () => {
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} atleta={atletaCadastrado()} />);

      await user.click(chip('Quarta'));

      expect(valorSelect('diaPreferidoLongo')).toBe('');
    });

    it('sem dia marcado bloqueia o salvamento, mesmo com longão legado', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} atleta={atletaCadastrado({ diasDisponiveis: [], diaPreferidoLongo: 'DOMINGO' })} />);

      await user.click(salvar());

      expect(await screen.findByText('Marque ao menos um dia')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('legado com longão fora dos dias mantém o valor como opção', async () => {
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} atleta={atletaCadastrado({ diaPreferidoLongo: 'DOMINGO' })} />);

      expect(screen.getByRole('combobox', { name: /dia do treino longo/i })).toHaveTextContent('Domingo');
      await user.click(screen.getByRole('combobox', { name: /dia do treino longo/i }));

      const opcoes = within(screen.getByRole('listbox')).getAllByRole('option').map(o => o.textContent);
      expect(opcoes).toEqual(['Domingo', 'Segunda', 'Quarta']);
    });

    it('envia os dias marcados pelos chips', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AtletaDialog open onClose={vi.fn()} onSave={onSave} />);

      await preencherCadastroCompleto(user);
      await user.click(chip('Sábado'));
      await user.click(salvar());

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ diasDisponiveis: ['TERCA', 'SABADO'], diaPreferidoLongo: 'TERCA' }),
      );
    });
  });

  describe('copy', () => {
    it('não expõe texto interno de padronização', () => {
      render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} />);

      expect(screen.queryByText(/linguagem visual/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/padronizados/i)).not.toBeInTheDocument();
      expect(screen.getByText('Identificação')).toBeInTheDocument();
      expect(screen.getByText('Perfil físico e objetivo')).toBeInTheDocument();
      expect(screen.getByText('Disponibilidade e saúde')).toBeInTheDocument();
    });

    it('botão primário muda com o modo', () => {
      const { rerender } = render(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Adicionar atleta' })).toBeInTheDocument();

      rerender(<AtletaDialog open onClose={vi.fn()} onSave={vi.fn()} atleta={atletaCadastrado()} />);
      expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
    });
  });
});
