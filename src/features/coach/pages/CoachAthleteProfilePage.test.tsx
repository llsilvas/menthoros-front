import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import CoachAthleteProfilePage from './CoachAthleteProfilePage';
import { SugestaoService } from '../../../api/services/SugestaoService';
import * as useAthleteProfileModule from '../../../hooks/useAthleteProfile';
import { useEnviarKudos } from '../../../hooks/useEnviarKudos';
import type { AtletaPerfilCoachDto } from '../../../types/AtletaPerfilCoach';

vi.mock('../../../hooks/useAthleteProfile');
vi.mock('../../../hooks/useEnviarKudos');
vi.mock('../../../api/services/SugestaoService');
vi.mock('../../athlete/components/PMCChart', () => ({
    default: () => <div data-testid="pmc-chart" />,
}));

// ── Stub ──────────────────────────────────────────────────────────────────────

const STUB_PROFILE: AtletaPerfilCoachDto = {
    atletaId: 'uuid-1',
    nomeAtleta: 'Ana Silva',
    objetivo: 'Maratona',
    proximaProva: null,
    nivelExperiencia: 'INTERMEDIARIO',
    pmc: [{ data: '2026-06-01', ctl: 50, atl: 55, tsb: -5, tss: 80 }],
    aderenciaSemanal: [
        { semanaInicio: '2026-06-08', totalPlanejado: 5, totalRealizado: 4, percentual: 80 },
    ],
    planoVigente: {
        planoId: 'plano-1',
        semanaInicio: '2026-06-16',
        semanaFim: '2026-06-22',
        reviewStatus: 'APROVADO',
        treinos: [
            { diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 8, statusExecucao: 'REALIZADO' },
        ],
    },
    sinaisRecentes: [
        { motivo: 'ADERENCIA', severidade: 'MEDIA', geradoEm: '2026-06-15T10:00:00Z', acaoSugerida: 'Verificar rotina', sugestaoId: null },
    ],
    sugestoesRecentes: [
        { id: 'sug-1', tipo: 'NOVO_PLANO', status: 'PENDING', criadoEm: '2026-06-14T08:00:00Z' },
    ],
    recordes: [],
    geradoEm: '2026-06-20T12:00:00Z',
    avisos: null,
};

function mockHook(overrides: Partial<ReturnType<typeof useAthleteProfileModule.useAthleteProfile>>) {
    vi.mocked(useAthleteProfileModule.useAthleteProfile).mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
        errorKind: null,
        fetchProfile: vi.fn(),
        ...overrides,
    });
}

function renderPage(atletaId = 'uuid-1') {
    return render(
        <MemoryRouter initialEntries={[`/coach/athletes/${atletaId}`]}>
            <Routes>
                <Route path="/coach/athletes/:atletaId" element={<CoachAthleteProfilePage />} />
                <Route path="/coach/athletes" element={<div>Roster</div>} />
                <Route path="/coach/inbox" element={<div>Inbox</div>} />
                <Route path="/coach/planos/revisao" element={<div>Revisão</div>} />
            </Routes>
        </MemoryRouter>
    );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CoachAthleteProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useEnviarKudos).mockReturnValue({ enviar: vi.fn().mockResolvedValue(undefined), loading: false, error: null });
        vi.mocked(SugestaoService.detalhe).mockResolvedValue({
            id: 'sug-1',
            atletaId: 'uuid-1',
            athleteName: 'Ana Silva',
            tipo: 'NEW_PLAN',
            status: 'PENDING',
            confidence: 'HIGH',
            summary: 'Revisar volume e criar novo microciclo',
            reasoning: {
                rationale: 'O atleta entrou em fase de transição e precisa de um novo ajuste.',
                sourceRules: ['plan_transition'],
                confidence: 'HIGH',
            },
            createdAt: '2026-06-14T08:00:00Z',
            reviewedAt: undefined,
            expiresAt: '2026-06-21T08:00:00Z',
        });
    });

    it('exibe spinner enquanto isLoading=true e profile=null', () => {
        mockHook({ isLoading: true, profile: null });
        renderPage();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('exibe nome e nível do atleta após carregar', () => {
        mockHook({ profile: STUB_PROFILE });
        renderPage();
        expect(screen.getByText('Ana Silva')).toBeInTheDocument();
        expect(screen.getByText(/INTERMEDIARIO/i)).toBeInTheDocument();
    });

    it('exibe objetivo do atleta quando presente', () => {
        mockHook({ profile: STUB_PROFILE });
        renderPage();
        expect(screen.getByText(/Maratona/i)).toBeInTheDocument();
    });

    it('exibe seção PMC Chart', () => {
        mockHook({ profile: STUB_PROFILE });
        renderPage();
        expect(screen.getByText(/Performance Management Chart/i)).toBeInTheDocument();
    });

    it('exibe seção Plano da semana', () => {
        mockHook({ profile: STUB_PROFILE });
        renderPage();
        expect(screen.getByText(/Plano da semana/i)).toBeInTheDocument();
    });

    it('exibe seção Aderência', () => {
        mockHook({ profile: STUB_PROFILE });
        renderPage();
        expect(screen.getByText(/Aderência/i)).toBeInTheDocument();
    });

    it('exibe seção Sinais recentes', () => {
        mockHook({ profile: STUB_PROFILE });
        renderPage();
        expect(screen.getByText(/Sinais recentes/i)).toBeInTheDocument();
    });

    it('exibe seção Sugestões recentes', () => {
        mockHook({ profile: STUB_PROFILE });
        renderPage();
        expect(screen.getByText(/Sugestões recentes/i)).toBeInTheDocument();
    });

    it('carrega o resumo completo das sugestões recentes', async () => {
        mockHook({ profile: STUB_PROFILE });
        renderPage();
        expect(await screen.findByText(/Revisar volume e criar novo microciclo/i)).toBeInTheDocument();
        expect(screen.getByText(/Alta/i)).toBeInTheDocument();
    });

    it('exibe alerta de erro genérico quando error está presente', () => {
        mockHook({ error: new Error('network'), profile: null });
        renderPage();
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Não foi possível carregar/i)).toBeInTheDocument();
    });

    it('exibe alerta de timeout quando errorKind é "timeout"', () => {
        mockHook({ error: new Error('timeout'), errorKind: 'timeout', profile: null });
        renderPage();
        expect(screen.getByText(/servidor demorou/i)).toBeInTheDocument();
    });

    it('exibe aviso de falha parcial quando avisos não vazio', () => {
        mockHook({ profile: { ...STUB_PROFILE, avisos: ['pmc', 'aderenciaSemanal'] } });
        renderPage();
        expect(screen.getByText(/pmc/i)).toBeInTheDocument();
    });

    it('navega de volta ao roster ao clicar em "Roster"', async () => {
        mockHook({ profile: STUB_PROFILE });
        renderPage();
        fireEvent.click(screen.getByText('Roster'));
        await waitFor(() => expect(screen.getByText('Roster')).toBeInTheDocument());
    });

    it('exibe plano AGUARDANDO_REVISAO com banner de revisão', () => {
        const perfilComPlanoAguardando: AtletaPerfilCoachDto = {
            ...STUB_PROFILE,
            planoVigente: {
                ...STUB_PROFILE.planoVigente!,
                reviewStatus: 'AGUARDANDO_REVISAO',
                treinos: [],
            },
        };
        mockHook({ profile: perfilComPlanoAguardando });
        renderPage();
        expect(screen.getByText(/aguardando revisão/i)).toBeInTheDocument();
    });

    it('exibe placeholder quando planoVigente é null', () => {
        mockHook({ profile: { ...STUB_PROFILE, planoVigente: null } });
        renderPage();
        expect(screen.getByText(/Nenhum plano gerado/i)).toBeInTheDocument();
    });

    it('abre o KudosDialog ao clicar em "Reconhecer progresso"', async () => {
        mockHook({ profile: STUB_PROFILE });
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: /reconhecer progresso/i }));

        expect(screen.getByText('Escolha o motivo do reconhecimento para este atleta.')).toBeInTheDocument();
    });

    it('envia o kudo com o atletaId da rota e fecha o dialog ao confirmar', async () => {
        mockHook({ profile: STUB_PROFILE });
        const enviar = vi.fn().mockResolvedValue(undefined);
        vi.mocked(useEnviarKudos).mockReturnValue({ enviar, loading: false, error: null });
        const user = userEvent.setup();
        renderPage('uuid-1');

        await user.click(screen.getByRole('button', { name: /reconhecer progresso/i }));
        await user.click(screen.getByRole('button', { name: /^reconhecer$/i }));

        expect(enviar).toHaveBeenCalledWith('uuid-1', { motivo: 'CONSISTENCIA' });
        await waitFor(() =>
            expect(screen.queryByText('Escolha o motivo do reconhecimento para este atleta.')).toBeNull(),
        );
    });
});
