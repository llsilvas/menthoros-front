import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeasonTabPanel } from './SeasonTabPanel';
import type { SeasonPlan } from '../../../../types/SeasonPlan';

const PLAN: SeasonPlan = {
  id: 's1', seasonStatus: 'PROPOSED', provaId: 'p1', provaNome: 'Maratona SP', provaData: '2027-04-04',
  shortPreparation: false, totalWeeks: 3, initialCtl: 40, peakVolumeKm: 52,
  weeks: [
    { weekIndex: 1, weekStart: '2026-11-16', phase: 'BASE', targetVolumeKm: 40.7, targetTss: 285, deload: false, longRunKm: 11.4, valueSource: 'ENGINE' },
    { weekIndex: 2, weekStart: '2026-11-23', phase: 'PEAK', targetVolumeKm: 52, targetTss: 364, deload: false, longRunKm: 14.6, valueSource: 'ENGINE' },
    { weekIndex: 3, weekStart: '2026-11-30', phase: 'RACE_WEEK', targetVolumeKm: 23.4, targetTss: 164, deload: false, valueSource: 'ENGINE' },
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
});
