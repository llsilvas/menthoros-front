import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import AthleteOnboardingPage from './AthleteOnboardingPage';
import { useOnboarding } from '../../../hooks/useOnboarding';
import type { OnboardingDraftInput, OnboardingConclusaoResult } from '../../../types/Onboarding';

const navigateMock = vi.fn();

vi.mock('react-router', async () => {
    const actual = await vi.importActual<typeof import('react-router')>('react-router');
    return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../../hooks/useOnboarding');

function mockUseOnboarding(overrides: Partial<ReturnType<typeof useOnboarding>> = {}) {
    vi.mocked(useOnboarding).mockReturnValue({
        atletaId: 'atleta-1',
        draft: {},
        profile: null,
        loading: false,
        saving: false,
        fetchError: null,
        fetchDraft: vi.fn(),
        updateDraft: vi.fn(),
        saveDraft: vi.fn().mockResolvedValue({}),
        concluir: vi.fn().mockResolvedValue({ status: 'COMPLETO' } as OnboardingConclusaoResult),
        ...overrides,
    });
}

function renderPage() {
    return render(<MemoryRouter><AthleteOnboardingPage /></MemoryRouter>);
}

describe('AthleteOnboardingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('mostra um spinner enquanto carrega', () => {
        mockUseOnboarding({ loading: true });
        renderPage();

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('mostra uma mensagem de erro quando o carregamento inicial falha', () => {
        mockUseOnboarding({ fetchError: new Error('boom') });
        renderPage();

        expect(screen.getByText(/erro ao carregar o onboarding/i)).toBeInTheDocument();
    });

    it('renderiza a primeira etapa (Perfil) com os campos de nível, dispositivo e canal', () => {
        mockUseOnboarding();
        renderPage();

        expect(screen.getByText('Nível de experiência')).toBeInTheDocument();
        expect(screen.getByText('Marca do dispositivo/relógio')).toBeInTheDocument();
        expect(screen.getByText('Canal de integração de treinos')).toBeInTheDocument();
        expect(screen.queryByText('intervals.icu')).toBeInTheDocument();
        expect(screen.queryByText('Strava')).not.toBeInTheDocument(); // ADR-0003
    });

    it('botão Avançar fica desabilitado até os campos obrigatórios da etapa serem preenchidos', () => {
        mockUseOnboarding();
        renderPage();

        expect(screen.getByRole('button', { name: /avançar/i })).toBeDisabled();
    });

    it('habilita Avançar quando os campos obrigatórios da etapa Perfil estão preenchidos', () => {
        mockUseOnboarding({
            draft: { nivelExperiencia: 'INTERMEDIARIO', dispositivoMarca: 'GARMIN', canalIntegracao: 'INTERVALS_ICU' },
        });
        renderPage();

        expect(screen.getByRole('button', { name: /avançar/i })).toBeEnabled();
    });

    it('chama updateDraft ao clicar numa opção da etapa Perfil', async () => {
        const updateDraft = vi.fn();
        mockUseOnboarding({ updateDraft });
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByText('Intermediário'));

        expect(updateDraft).toHaveBeenCalledWith({ nivelExperiencia: 'INTERMEDIARIO' });
    });

    it('salva o draft e avança para a próxima etapa ao clicar em Avançar', async () => {
        const saveDraft = vi.fn().mockResolvedValue({});
        mockUseOnboarding({
            draft: { nivelExperiencia: 'INTERMEDIARIO', dispositivoMarca: 'GARMIN', canalIntegracao: 'INTERVALS_ICU' },
            saveDraft,
        });
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: /avançar/i }));

        await waitFor(() => expect(saveDraft).toHaveBeenCalledOnce());
        expect(await screen.findByText(/qual é o seu objetivo/i)).toBeInTheDocument();
    });

    it('restaura o progresso salvo (retomar onboarding interrompido, CA8)', () => {
        const draft: OnboardingDraftInput = { objetivo: 'Correr uma maratona', nivelExperiencia: 'AVANCADO' };
        mockUseOnboarding({ draft });
        renderPage();

        // Etapa 1 (Perfil) mostra o nível já selecionado como preenchido
        const chip = screen.getByRole('radio', { name: 'Avançado' });
        expect(chip).toHaveAttribute('aria-checked', 'true');
    });

    it('mostra a tela de conclusão após preencher a prova alvo e clicar em Concluir', async () => {
        const concluir = vi.fn().mockResolvedValue({ status: 'COMPLETO' } as OnboardingConclusaoResult);
        mockUseOnboarding({
            draft: {
                nivelExperiencia: 'INTERMEDIARIO', dispositivoMarca: 'GARMIN', canalIntegracao: 'INTERVALS_ICU',
                objetivo: 'Correr uma maratona',
                diasDisponiveis: ['SEGUNDA'], duracaoDisponivelMin: 60, volumeSemanalMax: 40,
                temLesao: false,
            },
            concluir,
        });
        const user = userEvent.setup();
        renderPage();

        for (let i = 0; i < 4; i++) {
            await user.click(screen.getByRole('button', { name: /avançar/i }));
        }
        expect(await screen.findByText('Prova alvo')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Data da prova'), '2026-10-12');
        await user.click(screen.getByRole('radio', { name: 'Corrida de Rua' }));
        await user.click(screen.getByRole('radio', { name: '21 km (Meia Maratona)' }));
        await user.click(screen.getByRole('button', { name: /concluir/i }));

        await waitFor(() => expect(concluir).toHaveBeenCalledWith(expect.objectContaining({
            dataProva: '2026-10-12', tipoProva: 'CORRIDA_RUA', distancia: 'KM_21',
        })));
        expect(await screen.findByText(/onboarding concluído/i)).toBeInTheDocument();
    });
});
