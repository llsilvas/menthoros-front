import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import CoachAthleteProfilePage from './CoachAthleteProfilePage';
import * as useAthleteProfileModule from '../../../hooks/useAthleteProfile';
import type { AtletaPerfilCoachDto } from '../../../types/AtletaPerfilCoach';

vi.mock('../../../hooks/useAthleteProfile');

// ── Stub ──────────────────────────────────────────────────────────────────────

const STUB_PROFILE: AtletaPerfilCoachDto = {
    atletaId: 'uuid-1',
    nomeAtleta: 'Ana Silva',
    objetivo: 'Maratona',
    provaAlvo: null,
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
        { id: 'sug-1', tipo: 'NOVO_PLANO', status: 'PENDENTE', criadoEm: '2026-06-14T08:00:00Z' },
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
    beforeEach(() => vi.clearAllMocks());

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

    it('exibe alerta de erro genérico quando error está presente', () => {
        mockHook({ error: new Error('network'), profile: null });
        renderPage();
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Não foi possível carregar/i)).toBeInTheDocument();
    });

    it('exibe alerta de timeout para error.message contendo "timeout"', () => {
        mockHook({ error: new Error('timeout'), profile: null });
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
});
