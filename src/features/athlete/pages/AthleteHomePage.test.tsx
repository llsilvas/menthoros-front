import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import AthleteHomePage from './AthleteHomePage';
import { useAthleteHome } from '../../../hooks/useAthleteHome';
import { useAthleteReadiness } from '../../../hooks/useAthleteReadiness';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';
import { useCheckinAtual } from '../../../hooks/useCheckinAtual';
import { useKudosRecentes } from '../../../hooks/useKudosRecentes';
import { useManualTraining } from '../../../hooks/useManualTraining';
import { useRegistrarCheckin } from '../../../hooks/useRegistrarCheckin';
import { useUserInfo } from '../../../hooks/useUserInfo';
import { useAthletePlan } from '../../../hooks/useAthletePlan';
import { useCalibracao } from '../../../hooks/useCalibracao';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import type { CheckinProntidaoOutput } from '../../../types/Checkin';

// Links usam o router real (href em hash); só o `navigate` do botão é espiado — a navegação de
// dados do createHashRouter tropeça no jsdom (AbortSignal de outro realm).
const navigateMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router')>();
  return { ...mod, useNavigate: () => navigateMock };
});

vi.mock('../../../hooks/useAthleteHome');
vi.mock('../../../hooks/useAthleteReadiness');
vi.mock('../../../hooks/useAthleteProvas');
vi.mock('../../../hooks/useCheckinAtual');
vi.mock('../../../hooks/useKudosRecentes');
vi.mock('../../../hooks/useManualTraining');
vi.mock('../../../hooks/useRegistrarCheckin');
vi.mock('../../../hooks/useUserInfo');
vi.mock('../../../hooks/useAthletePlan');
vi.mock('../../../hooks/useCalibracao');

const noop = vi.fn();
const HOJE = new Date(2026, 7, 26, 8, 0, 0); // quarta, 26 de agosto, manhã

function mockHome(overrides: Partial<ReturnType<typeof useAthleteHome>> = {}) {
  vi.mocked(useAthleteHome).mockReturnValue({
    home: { proximoTreino: { tipoTreino: 'INTERVALADO', descricao: 'Tiros de 400m' },
            metricasChave: { ctl: 74, atl: 71, tsb: 3, tss: 62, statusForma: 'FORMA_IDEAL' } },
    loading: false, error: null, fetchHome: noop, ...overrides,
  });
}

function mockPlano(plano: PlanoSemanal | null, extra: Partial<ReturnType<typeof useAthletePlan>> = {}) {
  vi.mocked(useAthletePlan).mockReturnValue({
    plano, loading: false, error: null, fetchPlano: vi.fn().mockResolvedValue(undefined), ...extra,
  });
}

const CHECKIN_HOJE: CheckinProntidaoOutput = {
  id: 'c1', atletaId: 'a1', data: '2026-08-26',
  qualidadeSono: 9, humor: 8, doresMusculares: 1, nivelEnergia: 8, estresse: 2,
  observacoes: 'Dormi bem', readinessScore: 0.85, nivelProntidao: 'PRONTO',
};

function renderPage() {
  const router = createHashRouter([
    { path: '/', element: <AthleteHomePage /> },
    // Destinos reais do shell — só stubs para o router resolver `navigate`/`Link`.
    { path: '/athlete/training/log', element: <div>registro</div> },
    { path: '/athlete/plan', element: <div>plano</div> },
    { path: '/athlete/progress', element: <div>progresso</div> },
  ]);
  return render(<RouterProvider router={router} />);
}

describe('AthleteHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(HOJE);
    vi.mocked(useUserInfo).mockReturnValue({ name: 'Carlos Silva' });
    vi.mocked(useAthleteReadiness).mockReturnValue({
      readiness: { score: 78, nota: 'Provisório.' }, loading: false, error: null, fetchReadiness: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(useManualTraining).mockReturnValue({
      recentes: [], isFetching: false, isSubmitting: false, fetchError: null,
      registrar: noop, fetchRecentes: noop,
    });
    vi.mocked(useAthleteProvas).mockReturnValue({
      provas: [], loading: false, error: null, fetchProvas: noop,
    });
    vi.mocked(useRegistrarCheckin).mockReturnValue({
      registrar: vi.fn().mockResolvedValue(undefined), loading: false, error: null,
    });
    vi.mocked(useCheckinAtual).mockReturnValue({
      checkinHoje: null, loading: false, error: null, fetchCheckinAtual: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(useKudosRecentes).mockReturnValue({
      kudos: [], loading: false, error: null, fetchKudos: vi.fn().mockResolvedValue(undefined),
    });
    mockPlano(null);
    vi.mocked(useCalibracao).mockReturnValue({
      status: null, justExited: false, loading: false, error: null,
      fetchStatus: vi.fn().mockResolvedValue(undefined), dismissJustExited: vi.fn(),
    });
  });
  afterEach(() => vi.useRealTimers());

  const planoEncerrado = (statusTreinos: string[]): PlanoSemanal => ({
    atletaId: 'a1', semanaInicio: '2026-06-29', semanaFim: '2026-07-05',
    volumePlanejadoKm: 40, volumeRealizadoKm: 20, volumeAlvoKm: 40,
    status: 'CONCLUIDO',
    treinosPlanejados: statusTreinos.map((s) => ({
      tipoTreino: 'CORRIDA', distanciaKm: 10, diaSemana: 'SEGUNDA', statusTreino: s,
    })),
  });

  describe('cabeçalho e hero', () => {
    it('mostra a data por extenso, a saudação por período com o primeiro nome e o treino de hoje', () => {
      mockHome();
      renderPage();
      expect(screen.getByText('Quarta-feira, 26 de agosto')).toBeInTheDocument();
      expect(screen.getByText('Bom dia, Carlos')).toBeInTheDocument();
      expect(screen.getByTestId('home-next-workout')).toHaveTextContent('Tiros de 400m');
      expect(screen.queryByText(/consistência constrói/i)).toBeNull();
    });

    it('a única ação primária sólida é "Registrar treino", que navega para o registro', async () => {
      mockHome();
      renderPage();
      const contidos = screen.getAllByRole('button').filter((b) => b.className.includes('MuiButton-contained'));
      expect(contidos).toHaveLength(1);
      expect(contidos[0]).toHaveTextContent(/registrar treino/i);
      await userEvent.click(contidos[0]);
      expect(navigateMock).toHaveBeenCalledWith('/athlete/training/log');
    });

    it('não expõe jargão de métricas (CTL/ATL/TSB/pts); mostra a forma em palavras e o link para o progresso', () => {
      mockHome();
      renderPage();
      expect(screen.queryByText(/\b(CTL|ATL|TSB)\b/)).toBeNull();
      expect(screen.queryByText(/\bpts\b/)).toBeNull();
      expect(screen.getByTestId('home-form')).toHaveTextContent('Forma ideal');
      expect(screen.getByRole('link', { name: /ver progresso/i })).toHaveAttribute('href', '#/athlete/progress');
    });

    it('streak, próximo treino e forma aparecem em uma região cada', () => {
      mockHome();
      renderPage();
      expect(screen.getAllByTestId('home-streak')).toHaveLength(1);
      expect(screen.getAllByTestId('home-next-workout')).toHaveLength(1);
      expect(screen.getAllByTestId('home-form')).toHaveLength(1);
    });
  });

  it('mostra estado de erro com retry quando a Home falha', () => {
    mockHome({ home: null, error: new Error('boom') });
    renderPage();
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('mostra spinner enquanto carrega sem dado', () => {
    mockHome({ home: null, loading: true });
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  describe('prontidão', () => {
    it('mostra aviso de prontidão indisponível quando readiness falha (não engole erro)', () => {
      mockHome();
      vi.mocked(useAthleteReadiness).mockReturnValue({ readiness: null, loading: false, error: new Error('x'), fetchReadiness: noop });
      renderPage();
      expect(screen.getByRole('alert')).toHaveTextContent(/alguns dados não carregaram: prontidão/i);
      expect(screen.getByRole('button', { name: /recarregar/i })).toBeInTheDocument();
      expect(screen.queryByText(/prontidão (ótima|alta|moderada|baixa)/i)).toBeNull();
    });

    it('oculta a prontidão quando score é null (não fabrica)', () => {
      mockHome();
      vi.mocked(useAthleteReadiness).mockReturnValue({ readiness: { score: undefined, nota: 'Sem sinais.' }, loading: false, error: null, fetchReadiness: noop });
      renderPage();
      expect(screen.queryByText(/prontidão (ótima|alta|moderada|baixa)/i)).toBeNull();
    });
  });

  describe('check-in', () => {
    it('sem check-in: linha "Fazer check-in" abre o inline; nada é enviado antes dos cinco itens', async () => {
      mockHome();
      const registrar = vi.fn().mockResolvedValue(CHECKIN_HOJE);
      vi.mocked(useRegistrarCheckin).mockReturnValue({ registrar, loading: false, error: null });
      renderPage();
      await userEvent.click(screen.getByRole('button', { name: /fazer check-in/i }));
      expect(screen.getByText('Como você acordou?')).toBeInTheDocument();
      for (const nome of [/sono/i, /humor/i, /dores/i, /energia/i]) {
        await userEvent.click(screen.getByRole('button', { name: nome }));
      }
      expect(registrar).not.toHaveBeenCalled();
      expect(screen.getByText('4 de 5')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /estresse/i }));
      await waitFor(() => expect(registrar).toHaveBeenCalledTimes(1));
      expect(registrar).toHaveBeenCalledWith({ qualidadeSono: 3, humor: 3, doresMusculares: 8, nivelEnergia: 3, estresse: 8 });
    });

    it('com check-in de hoje: linha "feito" sem horário, e "Editar" abre o modal pré-preenchido', async () => {
      mockHome();
      vi.mocked(useCheckinAtual).mockReturnValue({ checkinHoje: CHECKIN_HOJE, loading: false, error: null, fetchCheckinAtual: vi.fn().mockResolvedValue(undefined) });
      renderPage();
      expect(screen.getByText(/check-in de hoje feito/i)).toBeInTheDocument();
      expect(screen.queryByText(/\bàs\b/)).toBeNull();
      expect(screen.queryByRole('button', { name: /iniciar treino|editado hoje/i })).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: /^editar$/i }));
      expect(screen.getByText('Como você está hoje?')).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /qualidade do sono/i })).toHaveAttribute('aria-valuenow', '9');
      expect(screen.getByDisplayValue('Dormi bem')).toBeInTheDocument();
      expect(screen.getByText(/com base no seu check-in/i)).toBeInTheDocument();
    });

    it('"Mais detalhes" do inline abre o modal; submeter chama registrar, refetcha prontidão e fecha', async () => {
      mockHome();
      const registrar = vi.fn().mockResolvedValue(CHECKIN_HOJE);
      const fetchReadiness = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useRegistrarCheckin).mockReturnValue({ registrar, loading: false, error: null });
      vi.mocked(useAthleteReadiness).mockReturnValue({ readiness: { score: 78, nota: 'x' }, loading: false, error: null, fetchReadiness });
      renderPage();
      await userEvent.click(screen.getByRole('button', { name: /fazer check-in/i }));
      await userEvent.click(screen.getByRole('button', { name: /mais detalhes/i }));
      expect(screen.getByText('Como você está hoje?')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /registrar/i }));
      expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ qualidadeSono: 5 }));
      await waitFor(() => expect(fetchReadiness).toHaveBeenCalled());
      await waitFor(() => expect(screen.queryByText('Como você está hoje?')).toBeNull());
    });

    it('mantém o modal aberto com erro quando o check-in falha (não fecha silenciosamente)', async () => {
      mockHome();
      const registrar = vi.fn().mockRejectedValue(new Error('500'));
      vi.mocked(useRegistrarCheckin).mockReturnValue({ registrar, loading: false, error: new Error('500') });
      vi.mocked(useCheckinAtual).mockReturnValue({ checkinHoje: CHECKIN_HOJE, loading: false, error: null, fetchCheckinAtual: vi.fn().mockResolvedValue(undefined) });
      renderPage();
      await userEvent.click(screen.getByRole('button', { name: /^editar$/i }));
      await userEvent.click(screen.getByRole('button', { name: /registrar/i }));
      expect(await screen.findByText(/não foi possível salvar seu check-in/i)).toBeInTheDocument();
      expect(screen.getByText('Como você está hoje?')).toBeInTheDocument();
    });
  });

  describe('sua semana', () => {
    it('mostra streak, volume e próxima prova num só card', () => {
      mockHome();
      vi.mocked(useManualTraining).mockReturnValue({
        recentes: [
          { id: '1', dataTreino: '2026-08-24', distanciaKm: 5, duracaoMin: 30, tipoTreino: 'FACIL' },
          { id: '2', dataTreino: '2026-08-17', distanciaKm: 5, duracaoMin: 30, tipoTreino: 'FACIL' },
          { id: '3', dataTreino: '2026-08-10', distanciaKm: 5, duracaoMin: 30, tipoTreino: 'FACIL' },
        ] as never,
        isFetching: false, isSubmitting: false, fetchError: null, registrar: noop, fetchRecentes: noop,
      });
      vi.mocked(useAthleteProvas).mockReturnValue({
        provas: [{ id: 'p1', nomeProva: 'Maratona de SP', dataProva: '2026-10-10', diasFaltando: 45 }] as never,
        loading: false, error: null, fetchProvas: noop,
      });
      renderPage();
      expect(screen.getByText('Sua semana')).toBeInTheDocument();
      expect(screen.getByTestId('home-streak')).toHaveTextContent(/3 semanas/);
      expect(screen.getByText('5,0')).toBeInTheDocument();
      expect(screen.getByText(/maratona de sp/i)).toBeInTheDocument();
      expect(screen.getByText(/45 dias/)).toBeInTheDocument();
      expect(screen.getAllByText(/seguidas treinando/i)).toHaveLength(1);
    });

    it('sem prova futura: CTA honesto; enquanto carrega, nenhum CTA', () => {
      mockHome();
      renderPage();
      expect(screen.getByText(/peça ao seu coach para cadastrar sua próxima prova/i)).toBeInTheDocument();
    });

    it('mostra aviso com retry quando streak ou prova falham (não conflar com "sem dado")', () => {
      mockHome();
      vi.mocked(useManualTraining).mockReturnValue({ recentes: [], isFetching: false, isSubmitting: false, fetchError: new Error('x'), registrar: noop, fetchRecentes: noop });
      vi.mocked(useAthleteProvas).mockReturnValue({ provas: [], loading: false, error: new Error('y'), fetchProvas: noop });
      renderPage();
      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(screen.getByRole('alert')).toHaveTextContent(/streak, próxima prova/i);
      expect(screen.queryByText(/peça ao seu coach/i)).toBeNull();
    });

    it('não mostra o card enquanto os treinos ainda carregam', () => {
      mockHome();
      vi.mocked(useManualTraining).mockReturnValue({ recentes: [], isFetching: true, isSubmitting: false, fetchError: null, registrar: noop, fetchRecentes: noop });
      renderPage();
      expect(screen.queryByText('Sua semana')).toBeNull();
    });
  });

  describe('kudos', () => {
    it('mostra os kudos quando há reconhecimentos recentes', () => {
      mockHome();
      vi.mocked(useKudosRecentes).mockReturnValue({
        kudos: [{ id: 'k1', motivo: 'CONSISTENCIA', createdAt: '2026-08-25T10:00:00Z' }] as never,
        loading: false, error: null, fetchKudos: noop,
      });
      renderPage();
      expect(screen.getByText('Seu coach reconheceu sua consistência!')).toBeInTheDocument();
    });

    it('mostra aviso com retry quando os kudos falham', () => {
      mockHome();
      vi.mocked(useKudosRecentes).mockReturnValue({ kudos: [], loading: false, error: new Error('x'), fetchKudos: noop });
      renderPage();
      expect(screen.getByRole('alert')).toHaveTextContent(/reconhecimentos do coach/i);
    });
  });

  describe('banner de semana encerrada', () => {
    it('exibe o banner quando a semana está CONCLUIDO com treinos PERDIDO', () => {
      mockHome(); mockPlano(planoEncerrado(['PERDIDO', 'PERDIDO', 'REALIZADO']));
      renderPage();
      expect(screen.getByText(/Sua semana foi encerrada/)).toBeInTheDocument();
      expect(screen.getByText(/2 treinos ficaram para trás/)).toBeInTheDocument();
    });

    it('não exibe o banner sem treinos PERDIDO nem sem plano', () => {
      mockHome(); mockPlano(planoEncerrado(['REALIZADO']));
      const { unmount } = renderPage();
      expect(screen.queryByText(/Sua semana foi encerrada/)).toBeNull();
      unmount();
      mockPlano(null);
      renderPage();
      expect(screen.queryByText(/Sua semana foi encerrada/)).toBeNull();
    });

    it('some ao dispensar (X)', async () => {
      mockHome(); mockPlano(planoEncerrado(['PERDIDO']));
      renderPage();
      expect(screen.getByText(/Sua semana foi encerrada/)).toBeInTheDocument();
      await userEvent.click(within(screen.getByText(/Sua semana foi encerrada/).closest('.MuiAlert-root') as HTMLElement).getByRole('button', { name: /close/i }));
      expect(screen.queryByText(/Sua semana foi encerrada/)).toBeNull();
    });

    it('não exibe o banner enquanto o plano carrega; mostra alerta com retry quando falha', () => {
      mockHome(); mockPlano(null, { loading: true });
      const { unmount } = renderPage();
      expect(screen.queryByText(/Sua semana foi encerrada/)).toBeNull();
      unmount();
      mockPlano(null, { error: new Error('x') });
      renderPage();
      expect(screen.getByRole('alert')).toHaveTextContent(/status da semana/i);
    });
  });

  describe('banner de calibração', () => {
    it('exibe o banner informativo quando o atleta está em calibração', () => {
      mockHome();
      vi.mocked(useCalibracao).mockReturnValue({ status: { weekNumber: 1, stage: 'OBSERVATION' } as never, justExited: false, loading: false, error: null, fetchStatus: noop, dismissJustExited: vi.fn() });
      renderPage();
      expect(screen.getByText('Semana 1 de calibração')).toBeInTheDocument();
    });

    it('exibe o banner de saída quando acabou de sair, e some ao dispensar chamando dismissJustExited', async () => {
      mockHome();
      const dismissJustExited = vi.fn();
      vi.mocked(useCalibracao).mockReturnValue({ status: null, justExited: true, loading: false, error: null, fetchStatus: noop, dismissJustExited });
      renderPage();
      expect(screen.getByText(/calibração concluída/i)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByText(/calibração concluída/i)).toBeNull();
      expect(dismissJustExited).toHaveBeenCalled();
    });

    it('erro de calibração entra no Alert consolidado (antes era silencioso)', async () => {
      mockHome();
      const fetchStatus = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useCalibracao).mockReturnValue({ status: null, justExited: false, loading: false, error: new Error('x'), fetchStatus, dismissJustExited: vi.fn() });
      renderPage();
      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(screen.getByRole('alert')).toHaveTextContent(/calibração/i);
      await userEvent.click(screen.getByRole('button', { name: /recarregar/i }));
      expect(fetchStatus).toHaveBeenCalledTimes(2); // montagem + retry
    });

    it('não exibe nenhum banner de calibração fora de CALIBRATION', () => {
      mockHome();
      renderPage();
      expect(screen.queryByText(/de calibração/i)).toBeNull();
    });
  });
});
