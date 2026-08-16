import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as reactRouter from 'react-router';
import { MemoryRouter, Route, Routes } from 'react-router';
import CoachInboxPage from './CoachInboxPage';
import { SugestaoService } from '../../../api/services/SugestaoService';
import { useCoachDashboard } from '../../../hooks/useCoachDashboard';
import { useAthleteProfile } from '../../../hooks/useAthleteProfile';
import type { CoachDashboard } from '../../../types/Coach';
import type { AtletaPerfilCoachDto, PmcPontoRaw } from '../../../types/AtletaPerfilCoach';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useOutletContext: vi.fn() };
});

vi.mock('../../../api/services/SugestaoService');
vi.mock('../../../hooks/useCoachDashboard');
vi.mock('../../../hooks/useAthleteProfile');
// PMCChart usa recharts (ResponsiveContainer colapsa em jsdom) — stub para isolar a aba.
vi.mock('../../athlete/components/PMCChart', () => ({
  default: () => <div>stub-pmc-chart</div>,
  PMCChart: () => <div>stub-pmc-chart</div>,
}));

const makeProfile = (pmc: PmcPontoRaw[] = []): AtletaPerfilCoachDto => ({
  atletaId: 'a1',
  nomeAtleta: 'Ana Silva',
  objetivo: null,
  proximaProva: null,
  nivelExperiencia: null,
  pmc,
  aderenciaSemanal: [],
  planoVigente: {
    planoId: 'plano-1',
    semanaInicio: '2026-06-23',
    semanaFim: '2026-06-29',
    reviewStatus: 'AGUARDANDO_REVISAO',
    treinos: [],
  },
  sinaisRecentes: [],
  sugestoesRecentes: [
    { id: 's1', tipo: 'AJUSTE_PLANO', status: 'PENDING', criadoEm: '2026-06-24T13:30:00Z' },
  ],
  recordes: [],
  geradoEm: '2026-06-24T13:32:25Z',
  avisos: null,
});

const mockRefetchQueue = vi.fn();
const mockReviewFetchPendentes = vi.fn().mockResolvedValue(undefined);
const mockReviewAprovar = vi.fn().mockResolvedValue(true);
const mockReviewRejeitar = vi.fn().mockResolvedValue(true);
const mockFetchProfile = vi.fn().mockResolvedValue(undefined);

const DASHBOARD_STUB: CoachDashboard = {
  generatedAt: '2026-06-24T13:32:25Z',
  summary: {
    kpis: {
      totalAtletas: 24,
      ativos: 18,
      emAtencao: 5,
      pausados: 1,
      treinosPlanejadosSemana: 96,
    },
    atletasExibidos: 10,
    itensFilaAtencao: 3,
  },
  roster: {
    items: [
      {
        atletaId: 'a1',
        nome: 'Ana Silva',
        status: 'warning',
        weeklyVolume: 32.5,
      },
    ],
    page: 0,
    size: 5,
    totalElements: 24,
    totalPages: 5,
  },
  attentionQueue: [
    {
      atletaId: 'a1',
      athleteName: 'Ana Silva',
      severity: 'ALTA',
      priorityScore: 92,
      primaryReason: 'FADIGA',
      suggestedAction: 'Reduzir o volume do próximo longão.',
      generatedAt: '2026-06-24T13:30:00Z',
      evidence: [{ label: 'ATL', value: '54' }],
    },
  ],
  calendar: {
    semanaInicio: '2026-06-23',
    semanaFim: '2026-06-29',
    treinos: [
      {
        atletaId: 'a1',
        nomeAtleta: 'Ana Silva',
        data: '2026-06-24',
        tipoTreino: 'INTERVALADO',
        isKeyWorkout: true,
        hasAlert: false,
        hasPendingSuggestion: true,
      },
    ],
  },
  insights: {
    kpis: {
      totalAtletas: 24,
      ativos: 18,
      emAtencao: 5,
      pausados: 1,
      treinosPlanejadosSemana: 96,
    },
    tendenciaCargaSemanal: [
      { semana: '2026-W24', volumeTotalKm: 120, tssTotal: 540 },
      { semana: '2026-W25', volumeTotalKm: 128, tssTotal: 580 },
    ],
    topAtletas: [{ atletaId: 'a1', nome: 'Ana Silva', volumeKm: 32.5 }],
  },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/coach/inbox']}>
      <Routes>
        <Route path="/coach/inbox" element={<CoachInboxPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CoachInboxPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SugestaoService.detalhe).mockResolvedValue({
      id: 's1',
      atletaId: 'a1',
      athleteName: 'Ana Silva',
      tipo: 'RECOVERY',
      status: 'PENDING',
      confidence: 'HIGH',
      summary: 'Reduzir intensidade do treino de quinta',
      reasoning: {
        rationale: 'Fadiga acumulada e queda de recuperação nos últimos 3 treinos.',
        sourceRules: ['fatigue_spike'],
        confidence: 'HIGH',
      },
      createdAt: '2026-06-24T13:30:00Z',
      reviewedAt: undefined,
      expiresAt: '2026-07-01T13:30:00Z',
    });
    vi.mocked(reactRouter.useOutletContext).mockReturnValue({
      coach: { id: 'c1', name: 'Coach', email: 'coach@exemplo.com' },
      consent: { granted: true, policyVersion: '2026-06-30', termsVersion: '2026-06-30' },
      queue: [],
      queueLoading: false,
      queueError: null,
      refetchQueue: mockRefetchQueue,
      reviewPendentes: [],
      reviewIsFetching: false,
      reviewIsActing: false,
      reviewFetchError: null,
      reviewActionError: null,
      reviewActiveFilter: 'AGUARDANDO_REVISAO',
      reviewSetFilter: vi.fn(),
      reviewFetchPendentes: mockReviewFetchPendentes,
      reviewAprovar: mockReviewAprovar,
      reviewRejeitar: mockReviewRejeitar,
    } satisfies Partial<CoachLayoutOutletContext> as CoachLayoutOutletContext);
    vi.mocked(useCoachDashboard).mockReturnValue({
      dashboard: DASHBOARD_STUB,
      loading: false,
      error: null,
      fetchDashboard: vi.fn(),
    });
    vi.mocked(useAthleteProfile).mockReturnValue({
      profile: makeProfile(),
      isLoading: false,
      error: null,
      errorKind: null,
      fetchProfile: mockFetchProfile,
    });
  });

  /**
   * Reescrito na task 1.5. Antes, este teste afirmava que existia um módulo "Fila de atenção"
   * separado — um preview de 3 itens que repetia atletas já listados ao lado. O módulo saiu; o que
   * precisa continuar verdadeiro é que **o sinal do atleta não se perdeu**: ele agora aparece no
   * card da lista principal, com motivo.
   */
  it('o sinal do atleta aparece na lista principal, com motivo', () => {
    renderPage();

    expect(screen.queryByText(/Fila de atenção/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('queue-row-motivo')).toHaveTextContent(/fadiga/i);
  });

  it('expõe exatamente 3 abas no drill-down do atleta', () => {
    renderPage();

    expect(screen.getByRole('tab', { name: /Diagnóstico/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Plano$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Provas & sugestões/i })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    // abas antigas não existem mais
    expect(screen.queryByRole('tab', { name: /Status do treinamento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Calendário de provas/i })).not.toBeInTheDocument();
  });

  it('mostra o diagnóstico do ATLETA na aba Diagnóstico (não insights globais)', () => {
    renderPage();

    // aba default é Diagnóstico
    expect(screen.getByText(/Carga aguda/i)).toBeInTheDocument();
    expect(screen.getByText(/Monotonia/i)).toBeInTheDocument();
    expect(screen.getByText(/Strain/i)).toBeInTheDocument();
    expect(screen.getByText(/Adesão nas últimas semanas/i)).toBeInTheDocument();
    expect(screen.getByText(/Sinais de atenção/i)).toBeInTheDocument();
    // conteúdo global do dashboard não aparece no drill-down
    expect(screen.queryByText(/Top atletas/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Treinos da semana/i)).not.toBeInTheDocument();
  });

  it('mostra a tendência de forma (PMC) junto da tendência de carga; vazio sem série', () => {
    renderPage();

    expect(screen.getByText(/Tendência de carga/i)).toBeInTheDocument();
    expect(screen.getByText(/Tendência de forma \(PMC\)/i)).toBeInTheDocument();
    // mock default sem série → estado vazio, sem montar o chart (recharts)
    expect(screen.getByText(/Sem histórico de PMC/i)).toBeInTheDocument();
    expect(screen.queryByText('stub-pmc-chart')).not.toBeInTheDocument();
  });

  it('renderiza o gráfico de tendência PMC quando o atleta tem série', async () => {
    vi.mocked(useAthleteProfile).mockReturnValue({
      profile: makeProfile([{ data: '2026-06-17', ctl: 52, atl: 60, tsb: -8, tss: 85 }]),
      isLoading: false,
      error: null,
      errorKind: null,
      fetchProfile: mockFetchProfile,
    });

    renderPage();

    // PMCChart é lazy — aguarda o stub resolver via Suspense.
    expect(await screen.findByText('stub-pmc-chart')).toBeInTheDocument();
  });

  it('mostra provas e sugestões do ATLETA na aba Provas & sugestões (não o calendário global)', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /Provas & sugestões/i }));

    expect(screen.getByText(/Provas do atleta/i)).toBeInTheDocument();
    expect(screen.getByText(/Sugestões recentes/i)).toBeInTheDocument();
    expect(await screen.findByText(/Reduzir intensidade do treino de quinta/i)).toBeInTheDocument();
    // calendário agregado do dashboard não aparece mais no drill-down
    expect(screen.queryByText(/Calendário semanal do dashboard/i)).not.toBeInTheDocument();
  });

  it('mostra o plano real do atleta na aba Plano (sem o mock "Ajuste rápido")', () => {
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /^Plano$/i }));

    expect(screen.getByText(/Plano real do atleta/i)).toBeInTheDocument();
    expect(screen.queryByText(/Ajuste rápido/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Impacto da alteração/i)).not.toBeInTheDocument();
  });

  it('abre diálogo de rejeição e chama o endpoint com motivo informado', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Mais ações/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Rejeitar plano/i }));

    expect(screen.getByRole('dialog', { name: /Rejeitar plano/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Motivo/i), { target: { value: 'Carga alta na semana da prova' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar rejeição/i }));

    await waitFor(() => expect(mockReviewRejeitar).toHaveBeenCalledWith('plano-1', 'Carga alta na semana da prova'));
    await waitFor(() => expect(mockReviewFetchPendentes).toHaveBeenCalled());
    await waitFor(() => expect(mockFetchProfile).toHaveBeenCalled());
  });
});
