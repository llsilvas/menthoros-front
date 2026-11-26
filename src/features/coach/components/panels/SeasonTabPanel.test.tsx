import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeasonTabPanel } from './SeasonTabPanel';
import type { SeasonPlan } from '../../../../types/SeasonPlan';

const PLAN: SeasonPlan = {
  id: 's1', seasonStatus: 'PROPOSED', provaId: 'p1', provaNome: 'Maratona SP', provaData: '2027-04-04',
  shortPreparation: false, firstProposal: false, totalWeeks: 3, initialCtl: 40, peakVolumeKm: 52,
  weeks: [
    { weekIndex: 1, weekStart: '2026-11-16', phase: 'BASE', targetVolumeKm: 40.7, targetTss: 285, deload: false, longRunKm: 11.4, valueSource: 'ENGINE', locked: false },
    { weekIndex: 2, weekStart: '2026-11-23', phase: 'PEAK', targetVolumeKm: 52, targetTss: 364, deload: false, longRunKm: 14.6, valueSource: 'ENGINE', locked: false },
    { weekIndex: 3, weekStart: '2026-11-30', phase: 'RACE_WEEK', targetVolumeKm: 23.4, targetTss: 164, deload: false, valueSource: 'ENGINE', locked: false },
  ],
  milestones: [],
  validations: [],
};

const HOJE = new Date(2026, 10, 25);

const base = { plan: null, loading: false, generating: false, loadError: null, generateError: null, approving: false, approveError: null, hasTargetRace: true, onGenerate: vi.fn(), onApprove: vi.fn(), onRetry: vi.fn(), hoje: HOJE };

describe('SeasonTabPanel', () => {
  it('proposta: faixa, KPIs e uma linha por semana', () => {
    render(<SeasonTabPanel {...base} plan={PLAN} />);

    expect(screen.getByText(/Proposta de temporada até Maratona SP/)).toBeInTheDocument();
    expect(screen.getByTestId('season-kpi-weeks')).toHaveTextContent('3');
    expect(screen.getByTestId('season-kpi-days')).toHaveTextContent('130');
    expect(screen.getByTestId('season-kpi-phase')).toHaveTextContent('Pico');
    expect(screen.getByTestId('season-kpi-peak')).toHaveTextContent('52,0 km');

    const rows = within(screen.getByRole('table', { name: 'Semanas da temporada' })).getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(rows[1]).toHaveTextContent(/1.*16\/11.*Base.*40,7 km.*11,4 km.*285/);
    expect(rows[3]).toHaveTextContent(/Semana da prova.*23,4 km.*—.*164/);
  });

  it('semana de descarga aparece marcada na tabela', () => {
    const comDescarga = { ...PLAN, weeks: PLAN.weeks.map((w) => (w.weekIndex === 1 ? { ...w, deload: true } : w)) };
    render(<SeasonTabPanel {...base} plan={comDescarga} />);

    const rows = within(screen.getByRole('table', { name: 'Semanas da temporada' })).getAllByRole('row');
    expect(rows[1]).toHaveTextContent(/Base · descarga/);
  });

  it('ativa: botão Ajustar temporada chama onAdjust', async () => {
    const onAdjust = vi.fn();
    render(<SeasonTabPanel {...base} plan={{ ...PLAN, seasonStatus: 'ACTIVE', version: 2 }} onAdjust={onAdjust} />);

    expect(screen.getByText(/versão 2/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ajustar temporada' }));
    expect(onAdjust).toHaveBeenCalledTimes(1);
  });

  it('ativa com ajuste aberto oferece Continuar ajuste', () => {
    render(<SeasonTabPanel {...base} plan={{ ...PLAN, seasonStatus: 'ACTIVE', openDraftId: 'v2' }} onAdjust={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Continuar ajuste' })).toBeInTheDocument();
  });

  it('proposta não oferece ajuste', () => {
    render(<SeasonTabPanel {...base} plan={PLAN} onAdjust={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Ajustar temporada' })).not.toBeInTheDocument();
  });

  it('erro ao abrir o ajuste aparece na aba', () => {
    render(<SeasonTabPanel {...base} plan={{ ...PLAN, seasonStatus: 'ACTIVE' }} onAdjust={vi.fn()}
      adjustError={new Error('O atleta já tem outra temporada proposta')} />);

    expect(screen.getByText('O atleta já tem outra temporada proposta')).toBeInTheDocument();
  });

  it('mapa da temporada com resumo acessível', () => {
    render(<SeasonTabPanel {...base} plan={PLAN} />);
    expect(screen.getByRole('img', { name: /3 semanas.*pico de 52,0 km/ })).toBeInTheDocument();
  });

  it('marcos e validações listados com a semana', () => {
    render(
      <SeasonTabPanel
        {...base}
        plan={{
          ...PLAN,
          milestones: [{ weekIndex: 2, provaId: 'p2', name: 'Meia de teste', date: '2026-11-29', distance: { value: '21K', label: '21 km (Meia Maratona)', short: '21K', order: 3 } }],
          validations: [{ rule: 'RAMP', severity: 'WARN', weekIndex: 2, measured: 27.8, limit: 10, message: 'Volume sobe 27,8% sobre a semana anterior (teto 10%)' }],
        }}
      />,
    );

    expect(within(screen.getByRole('list', { name: 'Marcos' })).getByText(/Meia de teste/)).toHaveTextContent(/Semana 2.*29\/11/);
    expect(within(screen.getByRole('list', { name: 'Validações' })).getByText(/Volume sobe 27,8%/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /marcos: Meia de teste na semana 2/ })).toBeInTheDocument();
  });

  it('sem alertas, diz que a proposta está dentro dos limites; sem marcos, diz que não há', () => {
    render(<SeasonTabPanel {...base} plan={PLAN} />);
    expect(screen.getByText('Proposta dentro dos limites.')).toBeInTheDocument();
    expect(screen.getByText('Sem provas preparatórias na janela.')).toBeInTheDocument();
  });

  it('temporada ativa não mostra a faixa de proposta nem o botão de aprovar', () => {
    render(<SeasonTabPanel {...base} plan={{ ...PLAN, seasonStatus: 'ACTIVE' }} />);
    expect(screen.queryByText(/Proposta de temporada/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprovar temporada' })).not.toBeInTheDocument();
  });

  it('proposta: botão aprova', async () => {
    const onApprove = vi.fn();
    render(<SeasonTabPanel {...base} plan={PLAN} onApprove={onApprove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Aprovar temporada' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('aprovando: botão desabilitado', () => {
    render(<SeasonTabPanel {...base} plan={PLAN} approving />);
    expect(screen.getByRole('button', { name: 'Aprovando…' })).toBeDisabled();
  });

  it('erro ao aprovar: mensagem do backend e o botão continua', () => {
    render(<SeasonTabPanel {...base} plan={PLAN} approveError={new Error('A prova-alvo foi cancelada')} />);
    expect(screen.getByText('A prova-alvo foi cancelada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprovar temporada' })).toBeEnabled();
  });

  it('sem prova-alvo: orienta e não oferece gerar', () => {
    render(<SeasonTabPanel {...base} hasTargetRace={false} />);
    expect(screen.getByText(/Sem prova-alvo/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gerar temporada' })).not.toBeInTheDocument();
  });

  it('prova-alvo sem temporada: botão gera', async () => {
    const onGenerate = vi.fn();
    render(<SeasonTabPanel {...base} onGenerate={onGenerate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Gerar temporada' }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('gerando: botão desabilitado', () => {
    render(<SeasonTabPanel {...base} generating />);
    expect(screen.getByRole('button', { name: 'Gerando…' })).toBeDisabled();
  });

  it('carregando: skeleton', () => {
    render(<SeasonTabPanel {...base} loading />);
    expect(screen.getByTestId('season-loading')).toBeInTheDocument();
  });

  it('erro na leitura: mensagem, Tentar de novo recarrega e não oferece gerar', async () => {
    const onRetry = vi.fn();
    render(<SeasonTabPanel {...base} loadError={new Error('Falhou')} onRetry={onRetry} />);
    expect(screen.getByText('Falhou')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gerar temporada' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('erro ao gerar: mensagem do backend e o botão de gerar continua', () => {
    render(<SeasonTabPanel {...base} generateError={new Error('Atleta sem base de carga')} />);
    expect(screen.getByText('Atleta sem base de carga')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar temporada' })).toBeEnabled();
  });

  it('atleta em calibração: botão desabilitado com o motivo e a semana', () => {
    render(
      <SeasonTabPanel
        {...base}
        calibration={{ phase: 'CALIBRATION', stage: 'STABILIZATION', weekNumber: 5, confidenceScore: 40 }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Gerar temporada' })).toBeDisabled();
    expect(screen.getByText(/em calibração \(semana 5\)/)).toBeInTheDocument();
  });

  it('fora de calibração: botão habilitado, sem aviso', () => {
    render(<SeasonTabPanel {...base} calibration={null} />);
    expect(screen.getByRole('button', { name: 'Gerar temporada' })).toBeEnabled();
    expect(screen.queryByText(/em calibração/)).not.toBeInTheDocument();
  });

  describe('partida da proposta v1 (critério 11)', () => {
    const V1: SeasonPlan = {
      ...PLAN, version: 1, firstProposal: true, initialVolumeKm: 20.8, proposedVolumeKm: 20.8, initialLongRunKm: 7.4, initialVolumeSource: 'MEDIAN',
      volumeHistory: [
        ['2026-09-21', 29.2], ['2026-09-28', 30], ['2026-10-05', 25.3], ['2026-10-12', 18.2],
        ['2026-10-19', 3.7], ['2026-10-26', 23.4], ['2026-11-02', 16.2], ['2026-11-09', 6.8],
      ].map(([weekStart, km]) => ({ weekStart: weekStart as string, km: km as number })),
    };

    it('mostra partida, origem, longão de partida e as 8 semanas', () => {
      render(<SeasonTabPanel {...base} plan={V1} onRecalculate={vi.fn()} />);

      expect(screen.getByTestId('season-start-volume')).toHaveTextContent('Volume de partida: 20,8 km · mediana das últimas 8 semanas');
      expect(screen.getByTestId('season-start-long-run')).toHaveTextContent('Longão de partida: 7,4 km');
      const semanas = within(screen.getByRole('list', { name: 'Semanas usadas na partida' })).getAllByRole('listitem');
      expect(semanas).toHaveLength(8);
      expect(semanas[0]).toHaveTextContent('21/09 · 29,2 km');
    });

    it('origem COACH mostra o volume que o motor propôs', () => {
      render(<SeasonTabPanel {...base} plan={{ ...V1, initialVolumeKm: 30, initialVolumeSource: 'COACH' }} />);

      expect(screen.getByTestId('season-start-volume')).toHaveTextContent('30,0 km · definido pelo treinador');
      expect(screen.getByText('O motor propôs 20,8 km.')).toBeInTheDocument();
    });

    it('sem longão de partida explica os 28%', () => {
      render(<SeasonTabPanel {...base} plan={{ ...V1, initialLongRunKm: undefined }} />);

      expect(screen.getByTestId('season-start-long-run')).toHaveTextContent(/sem treino nas últimas 6 semanas/);
    });

    it.each([
      ['ativa', { seasonStatus: 'ACTIVE' as const, firstProposal: false }],
      ['ajuste (v2)', { version: 2, baseSeasonPlanId: 'v1', firstProposal: false }],
      ['legada, sem origem', { initialVolumeSource: undefined }],
    ])('%s não mostra a partida', (_, extra) => {
      render(<SeasonTabPanel {...base} plan={{ ...V1, ...extra }} onRecalculate={vi.fn()} />);

      expect(screen.queryByText('Partida da temporada')).not.toBeInTheDocument();
    });

    it('"Ajustar volume e fases" recalcula com o longão, fecha o diálogo e a tabela reflete a proposta nova', async () => {
      const onRecalculate = vi.fn().mockResolvedValue(true);
      const { rerender } = render(<SeasonTabPanel {...base} plan={V1} onRecalculate={onRecalculate} />);

      await userEvent.click(screen.getByRole('button', { name: 'Ajustar volume e fases' }));
      const dialogo = screen.getByRole('dialog', { name: 'Ajustar volume e fases' });
      await userEvent.clear(within(dialogo).getByLabelText('Volume de partida (km)'));
      await userEvent.type(within(dialogo).getByLabelText('Volume de partida (km)'), '30');
      await userEvent.clear(within(dialogo).getByLabelText('Longão de partida (km)'));
      await userEvent.type(within(dialogo).getByLabelText('Longão de partida (km)'), '10');
      await userEvent.click(within(dialogo).getByRole('button', { name: 'Recalcular' }));
      await userEvent.click(within(screen.getByRole('dialog', { name: 'Recalcular o ajuste?' })).getByRole('button', { name: 'Recalcular' }));

      expect(onRecalculate).toHaveBeenCalledWith({
        phaseWeeks: { BASE: 1, BUILD: 0, PEAK: 1, TAPER: 0 }, startVolumeKm: 30, startLongRunKm: 10,
      });
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Ajustar volume e fases' })).not.toBeInTheDocument());

      const recalculada = {
        ...V1, initialVolumeKm: 30, initialLongRunKm: 10, initialVolumeSource: 'COACH' as const,
        weeks: V1.weeks.map((w) => (w.weekIndex === 1 ? { ...w, targetVolumeKm: 30.6, longRunKm: 10.2 } : w)),
      };
      rerender(<SeasonTabPanel {...base} plan={recalculada} onRecalculate={onRecalculate} />);
      // A confirmação ainda some em transição; a tabela volta a ser acessível quando o modal sai do DOM.
      const rows = within(await screen.findByRole('table', { name: 'Semanas da temporada' })).getAllByRole('row');
      expect(rows[1]).toHaveTextContent(/30,6 km.*10,2 km/);
    });

    it('erro do recálculo aparece na confirmação', async () => {
      render(<SeasonTabPanel {...base} plan={V1} onRecalculate={vi.fn().mockResolvedValue(false)}
        recalcError={new Error('Longão de partida inválido')} />);

      await userEvent.click(screen.getByRole('button', { name: 'Ajustar volume e fases' }));
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Recalcular' }));

      expect(within(screen.getByRole('dialog', { name: 'Recalcular o ajuste?' })).getByText('Longão de partida inválido')).toBeInTheDocument();
    });
  });

  it('Fechar fecha o diálogo de ajuste sem recalcular', async () => {
    const onRecalculate = vi.fn();
    render(<SeasonTabPanel {...base} plan={{ ...PLAN, firstProposal: true, initialVolumeKm: 20.8, initialVolumeSource: 'MEDIAN' }}
      onRecalculate={onRecalculate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ajustar volume e fases' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fechar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onRecalculate).not.toHaveBeenCalled();
  });

  it('alerta de longão explica que ele segue o maior treino recente', () => {
    render(<SeasonTabPanel {...base} plan={{ ...PLAN, validations: [{ rule: 'LONG_RUN_SHARE', severity: 'WARN', weekIndex: 1, measured: 35, limit: 30, message: 'Longão concentra 35% do volume da semana (teto 30%)' }] }} />);

    expect(within(screen.getByRole('list', { name: 'Validações' })).getByText(/maior treino recente do atleta/)).toBeInTheDocument();
  });
});
