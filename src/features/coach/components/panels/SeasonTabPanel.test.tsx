import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeasonTabPanel } from './SeasonTabPanel';
import type { SeasonPlan } from '../../../../types/SeasonPlan';

const PLAN: SeasonPlan = {
  id: 's1', seasonStatus: 'PROPOSED', provaId: 'p1', provaNome: 'Maratona SP', provaData: '2027-04-04',
  shortPreparation: false, totalWeeks: 3, initialCtl: 40, peakVolumeKm: 52,
  weeks: [
    { weekIndex: 1, weekStart: '2026-11-16', phase: 'BASE', targetVolumeKm: 40.7, targetTss: 285, deload: false, valueSource: 'ENGINE' },
    { weekIndex: 2, weekStart: '2026-11-23', phase: 'PEAK', targetVolumeKm: 52, targetTss: 364, deload: false, valueSource: 'ENGINE' },
    { weekIndex: 3, weekStart: '2026-11-30', phase: 'RACE_WEEK', targetVolumeKm: 23.4, targetTss: 164, deload: false, valueSource: 'ENGINE' },
  ],
};

const HOJE = new Date(2026, 10, 25);

const base = { plan: null, loading: false, generating: false, error: null, hasTargetRace: true, onGenerate: vi.fn(), onRetry: vi.fn(), hoje: HOJE };

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
    expect(rows[1]).toHaveTextContent(/1.*16\/11.*Base.*40,7 km.*285/);
    expect(rows[3]).toHaveTextContent(/Semana da prova.*164/);
  });

  it('temporada ativa não mostra a faixa de proposta', () => {
    render(<SeasonTabPanel {...base} plan={{ ...PLAN, seasonStatus: 'ACTIVE' }} />);
    expect(screen.queryByText(/Proposta de temporada/)).not.toBeInTheDocument();
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

  it('erro na leitura: mensagem e Tentar de novo recarrega', async () => {
    const onRetry = vi.fn();
    render(<SeasonTabPanel {...base} plan={PLAN} error={new Error('Falhou')} onRetry={onRetry} />);
    expect(screen.getByText('Falhou')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('erro ao gerar: mensagem do backend e o botão de gerar continua', () => {
    render(<SeasonTabPanel {...base} error={new Error('Atleta sem base de carga')} />);
    expect(screen.getByText('Atleta sem base de carga')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar temporada' })).toBeEnabled();
  });
});
