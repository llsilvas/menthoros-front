import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoachWelcomeWizard } from './CoachWelcomeWizard';
import { CoachOnboardingService } from '../../../api/services/CoachOnboardingService';
import { AssessoriaSettingsService } from '../../../api/services/AssessoriaSettingsService';
import type { AssessoriaMe } from '../../../types/AssessoriaSettings';

vi.mock('../../../api/services/CoachOnboardingService');
vi.mock('../../../api/services/AssessoriaSettingsService');

const ASSESSORIA: AssessoriaMe = {
  id: 'a1',
  nome: 'Corridas Serra',
  temLogo: false,
  logoUrl: null,
  plano: 'BASIC',
  uso: { atletas: 0, maxAtletas: 10, tecnicos: 1, maxTecnicos: 1 },
  version: 1,
};

const ATLETA = { id: 'atleta-1', nome: 'Ana Corredora' };

function apiError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

const montar = (onConcluido = vi.fn()) => {
  render(<CoachWelcomeWizard onConcluido={onConcluido} />);
  return onConcluido;
};

/** Avança da etapa 1 para a de atleta, sem alterar o nome da assessoria. */
async function irParaEtapaAtleta() {
  await screen.findByLabelText(/nome da assessoria/i);
  await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
}

describe('CoachWelcomeWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AssessoriaSettingsService.buscarMinhaAssessoria).mockResolvedValue({ ...ASSESSORIA });
    vi.mocked(CoachOnboardingService.concluir).mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(CoachOnboardingService.criarPrimeiroAtleta).mockResolvedValue(ATLETA as any);
    vi.mocked(CoachOnboardingService.convidarAtleta).mockResolvedValue(undefined);
  });

  describe('estrutura', () => {
    it('abre na etapa da assessoria com o nome atual', async () => {
      montar();

      expect(await screen.findByLabelText(/nome da assessoria/i)).toHaveValue('Corridas Serra');
      expect(screen.getByText('Sua assessoria')).toBeInTheDocument();
    });

    /** É um gate: sair por acidente devolveria o coach a um dashboard vazio sem explicação. */
    it('não oferece botão de fechar', async () => {
      montar();
      await screen.findByLabelText(/nome da assessoria/i);

      expect(screen.queryByRole('button', { name: /^fechar$/i })).not.toBeInTheDocument();
    });

    it('permite pular tudo, concluindo no servidor', async () => {
      const onConcluido = montar();
      await screen.findByLabelText(/nome da assessoria/i);

      await userEvent.click(screen.getByRole('button', { name: /pular por agora/i }));

      await waitFor(() => expect(CoachOnboardingService.concluir).toHaveBeenCalledTimes(1));
      expect(onConcluido).toHaveBeenCalled();
    });
  });

  describe('etapa da assessoria', () => {
    it('não chama o PATCH quando o nome não muda', async () => {
      montar();
      await irParaEtapaAtleta();

      expect(AssessoriaSettingsService.atualizar).not.toHaveBeenCalled();
      expect(screen.getByLabelText(/nome do atleta/i)).toBeInTheDocument();
    });

    it('salva o nome novo com a versão lida', async () => {
      vi.mocked(AssessoriaSettingsService.atualizar)
        .mockResolvedValue({ ...ASSESSORIA, nome: 'Corridas Serra Pro', version: 2 });
      montar();

      const campo = await screen.findByLabelText(/nome da assessoria/i);
      await userEvent.clear(campo);
      await userEvent.type(campo, 'Corridas Serra Pro');
      await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

      await waitFor(() => expect(AssessoriaSettingsService.atualizar)
        .toHaveBeenCalledWith({ nome: 'Corridas Serra Pro', version: 1 }));
    });
  });

  describe('etapa do atleta', () => {
    it('envia apenas os campos que o servidor exige', async () => {
      montar();
      await irParaEtapaAtleta();

      await userEvent.type(screen.getByLabelText(/nome do atleta/i), 'Ana Corredora');
      await userEvent.click(screen.getByRole('button', { name: /cadastrar atleta/i }));

      await waitFor(() => expect(CoachOnboardingService.criarPrimeiroAtleta)
        .toHaveBeenCalledWith(expect.objectContaining({ nome: 'Ana Corredora' })));
    });

    it('sem nome, o botão fica desabilitado', async () => {
      montar();
      await irParaEtapaAtleta();

      expect(screen.getByRole('button', { name: /cadastrar atleta/i })).toBeDisabled();
    });

    /**
     * A unicidade de e-mail é global, não por tenant — a mensagem não pode afirmar que o atleta
     * está na assessoria de quem está vendo.
     */
    it('conflito mostra mensagem neutra e não avança', async () => {
      vi.mocked(CoachOnboardingService.criarPrimeiroAtleta).mockRejectedValue(apiError(409));
      montar();
      await irParaEtapaAtleta();

      await userEvent.type(screen.getByLabelText(/nome do atleta/i), 'Ana Corredora');
      await userEvent.click(screen.getByRole('button', { name: /cadastrar atleta/i }));

      const alerta = await screen.findByText(/já existe um atleta cadastrado/i);
      expect(alerta).toBeInTheDocument();
      expect(alerta.textContent).not.toMatch(/sua assessoria/i);
      expect(screen.getByLabelText(/nome do atleta/i)).toBeInTheDocument();
    });
  });

  describe('etapa do convite', () => {
    async function chegarNoConvite() {
      await irParaEtapaAtleta();
      await userEvent.type(screen.getByLabelText(/nome do atleta/i), 'Ana Corredora');
      await userEvent.click(screen.getByRole('button', { name: /cadastrar atleta/i }));
      await screen.findByRole('button', { name: /enviar convite/i });
    }

    /**
     * O endpoint REENVIA a cada chamada. Um segundo clique manda outro e-mail ao atleta, que não
     * tem como saber que foi engano — por isso o botão trava depois do primeiro sucesso.
     */
    it('o convite não pode ser enviado duas vezes', async () => {
      montar();
      await chegarNoConvite();

      const botao = screen.getByRole('button', { name: /enviar convite/i });
      await userEvent.click(botao);

      await waitFor(() => expect(screen.getByText(/convite enviado/i)).toBeInTheDocument());
      expect(botao).toBeDisabled();
      expect(CoachOnboardingService.convidarAtleta).toHaveBeenCalledTimes(1);
    });

    it('conclui chamando o servidor e avisando o layout', async () => {
      const onConcluido = montar();
      await chegarNoConvite();

      await userEvent.click(screen.getByRole('button', { name: /concluir/i }));

      await waitFor(() => expect(CoachOnboardingService.concluir).toHaveBeenCalled());
      expect(onConcluido).toHaveBeenCalled();
    });

    it('falha ao concluir não libera o dashboard', async () => {
      vi.mocked(CoachOnboardingService.concluir).mockRejectedValue(new Error('rede caiu'));
      const onConcluido = montar();
      await chegarNoConvite();

      await userEvent.click(screen.getByRole('button', { name: /concluir/i }));

      expect(await screen.findByText(/não foi possível concluir/i)).toBeInTheDocument();
      expect(onConcluido).not.toHaveBeenCalled();
    });
  });
});
