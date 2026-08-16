import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { CoachWelcomeWizard } from './CoachWelcomeWizard';
import { CoachOnboardingService } from '../../../api/services/CoachOnboardingService';
import { AssessoriaSettingsService } from '../../../api/services/AssessoriaSettingsService';
import { ROUTES } from '../../../constants/routes';
import type { AssessoriaMe } from '../../../types/AssessoriaSettings';

const navigateMock = vi.fn();
/**
 * `useNavigate` mockado — padrão já estabelecido no módulo (`ManualTrainingFormPage.test.tsx`).
 *
 * Não é preferência de estilo: sob jsdom, **nenhum** router deste projeto executa navegação
 * programática. Verificado com um caso mínimo — botão + `useNavigate`, sem nada deste componente —
 * que fica parado em `/` tanto com `createHashRouter` quanto com `createMemoryRouter`. Um teste
 * baseado em rota renderizada falharia sempre, mesmo com o código correto.
 *
 * O que fica de fora: que `/coach/athletes` realmente resolve para a tela de atletas. Isso é
 * cobertura de E2E, e o teste abaixo ancora o destino em `ROUTES` em vez de repetir a string.
 */
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigateMock };
});

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

const montar = (onConcluido = vi.fn()) => {
  render(<MemoryRouter><CoachWelcomeWizard onConcluido={onConcluido} /></MemoryRouter>);
  return onConcluido;
};

/** Avança da etapa da assessoria para a final, sem alterar o nome. */
async function irParaEtapaFinal() {
  await screen.findByLabelText(/nome da assessoria/i);
  await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
}

describe('CoachWelcomeWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
    vi.mocked(AssessoriaSettingsService.buscarMinhaAssessoria).mockResolvedValue({ ...ASSESSORIA });
    vi.mocked(CoachOnboardingService.concluir).mockResolvedValue(undefined);
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

    /**
     * O wizard **não cadastra atleta**. Pedir os dados de outra pessoa no primeiro minuto de uso é
     * atrito no pior momento possível: o coach ainda está aprendendo a interface, pode não ter os
     * dados à mão, e o cadastro errado feito aqui vira lixo difícil de remover.
     */
    it('não pede cadastro de atleta em nenhuma etapa', async () => {
      montar();
      await screen.findByLabelText(/nome da assessoria/i);
      expect(screen.queryByLabelText(/nome do atleta/i)).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

      expect(screen.queryByLabelText(/nome do atleta/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cadastrar atleta$/i })).not.toBeInTheDocument();
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
      await irParaEtapaFinal();

      expect(AssessoriaSettingsService.atualizar).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: /tudo pronto/i })).toBeInTheDocument();
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

  describe('etapa final', () => {
    /**
     * O gate do layout continua fechado até o servidor registrar a conclusão. Navegar antes traria
     * o wizard de volta por cima da tela de atletas — por isso conclui primeiro, navega depois.
     */
    it('conclui no servidor ANTES de levar para a tela de atletas', async () => {
      const onConcluido = montar();
      await irParaEtapaFinal();

      await userEvent.click(screen.getByRole('button', { name: /cadastrar meu primeiro atleta/i }));

      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(ROUTES.COACH_ATHLETES));
      expect(CoachOnboardingService.concluir).toHaveBeenCalled();
      expect(onConcluido).toHaveBeenCalled();
      // A ordem é o ponto do teste: navegar antes de concluir traria o wizard de volta por cima.
      expect(vi.mocked(CoachOnboardingService.concluir).mock.invocationCallOrder[0])
        .toBeLessThan(navigateMock.mock.invocationCallOrder[0]);
    });

    it('falha ao concluir não navega nem libera o dashboard', async () => {
      vi.mocked(CoachOnboardingService.concluir).mockRejectedValue(new Error('rede caiu'));
      const onConcluido = montar();
      await irParaEtapaFinal();

      await userEvent.click(screen.getByRole('button', { name: /cadastrar meu primeiro atleta/i }));

      expect(await screen.findByText(/não foi possível concluir/i)).toBeInTheDocument();
      expect(onConcluido).not.toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('"fazer depois" conclui sem navegar', async () => {
      const onConcluido = montar();
      await irParaEtapaFinal();

      await userEvent.click(screen.getByRole('button', { name: /fazer depois/i }));

      await waitFor(() => expect(onConcluido).toHaveBeenCalled());
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
