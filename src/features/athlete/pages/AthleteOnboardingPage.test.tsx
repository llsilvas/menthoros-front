import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import AthleteOnboardingPage from './AthleteOnboardingPage';
import { useOnboarding } from '../../../hooks/useOnboarding';
import { simularLarguraDaTela } from '../../../test/matchMedia';
import type { OnboardingDraftInput, OnboardingConclusaoResult } from '../../../types/Onboarding';

const navigateMock = vi.fn();

vi.mock('react-router', async () => {
    const actual = await vi.importActual<typeof import('react-router')>('react-router');
    return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../../hooks/useOnboarding');

/** Rascunho com tudo que as quatro primeiras etapas exigem — para os testes que só olham a última. */
const DRAFT_COMPLETO: OnboardingDraftInput = {
    nivelExperiencia: 'INTERMEDIARIO',
    objetivo: 'Completar minha primeira prova',
    diasDisponiveis: ['SEGUNDA'],
    dispositivoMarca: 'GARMIN',
};

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

function renderPageComoCoach(atletaId = 'atleta-1') {
    return render(
        <MemoryRouter initialEntries={[`/coach/athletes/${atletaId}/onboarding`]}>
            <Routes>
                <Route path="/coach/athletes/:atletaId/onboarding" element={<AthleteOnboardingPage />} />
            </Routes>
        </MemoryRouter>,
    );
}

const avancar = () => screen.getByRole('button', { name: /avançar|pular/i });

/** Percorre as quatro etapas de rascunho até a prova alvo (o draft já vem completo). */
async function irAteAProva(user: ReturnType<typeof userEvent.setup>) {
    for (let i = 0; i < 4; i++) {
        await user.click(avancar());
    }
    expect(await screen.findByText(/você já tem uma prova em vista/i)).toBeInTheDocument();
}

describe('AthleteOnboardingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        simularLarguraDaTela(1024);
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

    /** O onboarding abre pelo atleta, não pelo relógio: nível e objetivo vêm antes de marca e canal. */
    it('a primeira etapa pergunta experiência e objetivo — relógio fica para depois', () => {
        mockUseOnboarding();
        renderPage();

        // Por papel, não por texto: a pergunta também aparece na linha "Falta: …".
        expect(screen.getByRole('radiogroup', { name: /há quanto tempo você corre/i })).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: /o que você quer com o treino/i })).toBeInTheDocument();
        // "Relógio" existe como rótulo do Stepper; o que não pode estar aqui são as perguntas dele.
        expect(screen.queryByRole('radio', { name: 'Garmin' })).not.toBeInTheDocument();
        expect(screen.queryByRole('radio', { name: 'intervals.icu' })).not.toBeInTheDocument();
    });

    it('com a etapa incompleta, Avançar fica desabilitado e a tela diz o que falta', () => {
        mockUseOnboarding({ draft: { nivelExperiencia: 'INICIANTE' } });
        renderPage();

        expect(screen.getByRole('button', { name: /avançar/i })).toBeDisabled();
        expect(screen.getByTestId('onboarding-falta')).toHaveTextContent('Falta: seu objetivo.');
    });

    it('lista tudo que falta quando há mais de um campo pendente', () => {
        mockUseOnboarding();
        renderPage();

        expect(screen.getByTestId('onboarding-falta')).toHaveTextContent('Falta: há quanto tempo você corre e seu objetivo.');
    });

    it('escolher um objetivo pronto grava o texto do chip em `objetivo`', async () => {
        const updateDraft = vi.fn();
        mockUseOnboarding({ updateDraft });
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('radio', { name: 'Melhorar meu tempo' }));

        expect(updateDraft).toHaveBeenCalledWith({ objetivo: 'Melhorar meu tempo' });
    });

    it('"Outro" abre o campo livre do objetivo', async () => {
        mockUseOnboarding();
        const user = userEvent.setup();
        renderPage();

        expect(screen.queryByLabelText('Seu objetivo')).not.toBeInTheDocument();
        await user.click(screen.getByRole('radio', { name: 'Outro' }));

        expect(screen.getByLabelText('Seu objetivo')).toBeInTheDocument();
    });

    it('salva o draft e avança para a etapa de rotina ao clicar em Avançar', async () => {
        const saveDraft = vi.fn().mockResolvedValue({});
        mockUseOnboarding({ draft: { nivelExperiencia: 'INTERMEDIARIO', objetivo: 'Melhorar meu tempo' }, saveDraft });
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: /avançar/i }));

        await waitFor(() => expect(saveDraft).toHaveBeenCalledOnce());
        expect(await screen.findByText(/em quais dias você consegue treinar/i)).toBeInTheDocument();
    });

    /** Duração e volume saíram do onboarding (decisão 2026-10-23): o iniciante não sabe responder. */
    it('a etapa de rotina não pede duração por sessão nem volume semanal', async () => {
        mockUseOnboarding({ draft: DRAFT_COMPLETO });
        const user = userEvent.setup();
        renderPage();

        await user.click(avancar());

        expect(await screen.findByText(/em quais dias você consegue treinar/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/duração/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/volume/i)).not.toBeInTheDocument();
    });

    it('a etapa de saúde, sem nada respondido, oferece "Pular"', async () => {
        mockUseOnboarding({ draft: DRAFT_COMPLETO });
        const user = userEvent.setup();
        renderPage();

        await user.click(avancar());
        await user.click(avancar());

        expect(await screen.findByText(/alguma lesão ou dor agora/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Pular' })).toBeEnabled();
    });

    it('Voltar também salva o rascunho', async () => {
        const saveDraft = vi.fn().mockResolvedValue({});
        mockUseOnboarding({ draft: DRAFT_COMPLETO, saveDraft });
        const user = userEvent.setup();
        renderPage();

        await user.click(avancar());
        await user.click(screen.getByRole('button', { name: /voltar/i }));

        await waitFor(() => expect(saveDraft).toHaveBeenCalledTimes(2));
        expect(await screen.findByText(/há quanto tempo você corre/i)).toBeInTheDocument();
    });

    it('restaura o progresso salvo (retomar onboarding interrompido, CA8)', () => {
        const draft: OnboardingDraftInput = { objetivo: 'Correr uma maratona', nivelExperiencia: 'AVANCADO' };
        mockUseOnboarding({ draft });
        renderPage();

        expect(screen.getByRole('radio', { name: 'Avançado' })).toHaveAttribute('aria-checked', 'true');
        // Objetivo fora dos presets reabre o campo livre com o texto salvo.
        expect(screen.getByLabelText('Seu objetivo')).toHaveValue('Correr uma maratona');
    });

    describe('prova alvo (opcional)', () => {
        it('"Ainda não" conclui com corpo vazio e mostra o resumo com "Nenhuma por enquanto"', async () => {
            const concluir = vi.fn().mockResolvedValue({ status: 'COMPLETO' } as OnboardingConclusaoResult);
            mockUseOnboarding({ draft: DRAFT_COMPLETO, concluir });
            const user = userEvent.setup();
            renderPage();

            await irAteAProva(user);
            expect(screen.getByRole('button', { name: /concluir/i })).toBeDisabled();
            await user.click(screen.getByRole('radio', { name: 'Ainda não' }));
            await user.click(screen.getByRole('button', { name: /concluir/i }));

            await waitFor(() => expect(concluir).toHaveBeenCalledWith({}));
            expect(await screen.findByText(/perfil enviado/i)).toBeInTheDocument();
            expect(screen.getByText('Nenhuma por enquanto')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /cadastrar uma prova/i })).toBeInTheDocument();
        });

        it('com prova, infere o tipo pela distância e não pede "tipo da prova"', async () => {
            const concluir = vi.fn().mockResolvedValue({ status: 'COMPLETO' } as OnboardingConclusaoResult);
            mockUseOnboarding({ draft: DRAFT_COMPLETO, concluir });
            const user = userEvent.setup();
            renderPage();

            await irAteAProva(user);
            await user.click(screen.getByRole('radio', { name: 'Sim, já tenho' }));
            expect(screen.queryByText(/tipo da prova/i)).not.toBeInTheDocument();
            expect(screen.getByTestId('onboarding-falta')).toHaveTextContent('Falta: data da prova e distância.');

            await user.type(screen.getByLabelText('Data da prova'), '2027-03-14');
            await user.click(screen.getByRole('radio', { name: '21 km (Meia Maratona)' }));
            await user.click(screen.getByRole('button', { name: /concluir/i }));

            await waitFor(() => expect(concluir).toHaveBeenCalledWith({
                dataProva: '2027-03-14', distancia: 'KM_21', tipoProva: 'MEIA',
            }));
            expect(await screen.findByText(/perfil enviado/i)).toBeInTheDocument();
            expect(screen.queryByRole('link', { name: /cadastrar uma prova/i })).not.toBeInTheDocument();
        });

        it('percurso em trilha vira TRAIL', async () => {
            const concluir = vi.fn().mockResolvedValue({ status: 'COMPLETO' } as OnboardingConclusaoResult);
            mockUseOnboarding({ draft: DRAFT_COMPLETO, concluir });
            const user = userEvent.setup();
            renderPage();

            await irAteAProva(user);
            await user.click(screen.getByRole('radio', { name: 'Sim, já tenho' }));
            await user.type(screen.getByLabelText('Data da prova'), '2027-03-14');
            await user.click(screen.getByRole('radio', { name: '10 km' }));
            await user.click(screen.getByRole('radio', { name: 'Trilha' }));
            await user.click(screen.getByRole('button', { name: /concluir/i }));

            await waitFor(() => expect(concluir).toHaveBeenCalledWith(expect.objectContaining({ tipoProva: 'TRAIL' })));
        });
    });

    describe('tela estreita (celular)', () => {
        it('troca o Stepper por "Passo N de 5" com barra de progresso', () => {
            simularLarguraDaTela(390);
            mockUseOnboarding();
            renderPage();

            const progresso = screen.getByTestId('onboarding-progresso-compacto');
            expect(within(progresso).getByText('Passo 1 de 5')).toBeInTheDocument();
            expect(within(progresso).getByText('Você')).toBeInTheDocument();
            // Sem os rótulos dos cinco passos em linha (era o que cortava em 390px).
            expect(screen.queryByText('Relógio')).not.toBeInTheDocument();
        });
    });

    describe('contexto do coach (rota /coach/athletes/:atletaId/onboarding, coach-como-proxy)', () => {
        it('repassa o atletaId da URL para useOnboarding em vez de resolver via getMe()', () => {
            mockUseOnboarding();
            renderPageComoCoach('atleta-77');

            expect(useOnboarding).toHaveBeenCalledWith('atleta-77');
        });

        it('não recebe nenhum atletaId quando renderizada na rota do próprio atleta', () => {
            mockUseOnboarding();
            renderPage();

            expect(useOnboarding).toHaveBeenCalledWith(undefined);
        });

        it('ao concluir, navega de volta para o perfil do atleta no coach (não ATHLETE_HOME) e não oferece cadastrar prova', async () => {
            const concluir = vi.fn().mockResolvedValue({ status: 'COMPLETO' } as OnboardingConclusaoResult);
            mockUseOnboarding({ draft: DRAFT_COMPLETO, concluir });
            const user = userEvent.setup();
            renderPageComoCoach('atleta-77');

            await irAteAProva(user);
            await user.click(screen.getByRole('radio', { name: 'Ainda não' }));
            await user.click(screen.getByRole('button', { name: /concluir/i }));

            const botaoVoltar = await screen.findByRole('button', { name: /voltar ao perfil do atleta/i });
            expect(screen.queryByRole('link', { name: /cadastrar uma prova/i })).not.toBeInTheDocument();
            await user.click(botaoVoltar);

            expect(navigateMock).toHaveBeenCalledWith('/coach/athletes/atleta-77');
        });
    });
});
