import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AdherenceToneLegend, WeeklyAdherenceLoadChart } from './WeeklyAdherenceLoadChart';
import { describeWeek } from '../adapters/diagnosisChartsAdapters';
import type { WeeklyDiagnosisPoint } from '../types/CoachInbox';

function semana(over: Partial<WeeklyDiagnosisPoint> = {}): WeeklyDiagnosisPoint {
  return {
    weekStart: '2026-09-21',
    label: '21/09',
    tss: 120,
    activeDays: 3,
    planned: 4,
    completed: 3,
    adherence: 75,
    noData: false,
    current: false,
    distanceKm: null,
    ...over,
  };
}

const DISPONIVEL = { adherenceAvailable: true, pmcAvailable: true };

describe('WeeklyAdherenceLoadChart', () => {
  it('com km do backend, o painel de carga é em km', () => {
    render(<WeeklyAdherenceLoadChart weeks={[semana({ distanceKm: 34.2 })]} gaps={[]} {...DISPONIVEL} />);
    expect(screen.getByText(/carga semanal \(km\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/carga semanal \(tss\)/i)).not.toBeInTheDocument();
  });

  it('sem plano e sem carga → estado vazio', () => {
    render(<WeeklyAdherenceLoadChart weeks={[semana({ tss: null, activeDays: null, adherence: null })]} gaps={[]} {...DISPONIVEL} />);
    expect(screen.getByText('Sem plano nem carga nas últimas 8 semanas.')).toBeInTheDocument();
  });

  it('com dados, mostra os dois painéis; a legenda fica no cabeçalho do card, fora do gráfico', () => {
    render(<WeeklyAdherenceLoadChart weeks={[semana()]} gaps={[]} {...DISPONIVEL} />);
    expect(screen.getByText(/adesão ao plano/i)).toBeInTheDocument();
    expect(screen.getByText(/carga semanal \(tss\)/i)).toBeInTheDocument();
    expect(screen.queryByText('≥ 90%')).not.toBeInTheDocument();
  });

  it('legenda da escala de adesão em 4 faixas', () => {
    render(<AdherenceToneLegend />);
    const itens = within(screen.getByRole('list', { name: 'Escala de adesão' })).getAllByRole('listitem');
    expect(itens.map((i) => i.textContent)).toEqual(['≥ 90%', '70–89%', '40–69%', '< 40%']);
  });

  /** A lacuna precisa ser dita em texto: o gráfico sozinho não é lido por leitor de tela. */
  it('descreve cada lacuna de registro', () => {
    render(
      <WeeklyAdherenceLoadChart
        weeks={[semana(), semana({ weekStart: '2026-08-10', label: '10/08', noData: true, tss: null, activeDays: null })]}
        gaps={[{ start: '2026-07-16', end: '2026-09-13', days: 60, open: false, kind: 'SEM_REGISTRO' }]}
        {...DISPONIVEL}
      />,
    );
    expect(screen.getByText('Sem treinos registrados de 16/07 a 13/09 (60 dias)')).toBeInTheDocument();
  });

  it('consulta de aderência que falhou: painel diz "Dado indisponível", sem estado vazio falso', () => {
    render(
      <WeeklyAdherenceLoadChart
        weeks={[semana({ adherence: null, planned: null, completed: null })]}
        gaps={[]}
        adherenceAvailable={false}
        pmcAvailable
      />,
    );
    expect(screen.getByText('Adesão: dado indisponível')).toBeInTheDocument();
    expect(screen.getByText(/carga semanal \(tss\)/i)).toBeInTheDocument();
  });

  it('as duas consultas falharam: um aviso só, não "sem plano nem carga"', () => {
    render(<WeeklyAdherenceLoadChart weeks={[]} gaps={[]} adherenceAvailable={false} pmcAvailable={false} />);
    expect(screen.getByText('Dado indisponível')).toBeInTheDocument();
    expect(screen.queryByText(/sem plano nem carga/i)).not.toBeInTheDocument();
  });
});

describe('describeWeek (tooltip)', () => {
  it('com km, a carga mostra km e TSS', () => {
    expect(describeWeek(semana({ distanceKm: 34.2 }), DISPONIVEL).load).toBe('Carga 34,2 km · 120 TSS · 3 dias com treino');
  });

  it('com km e sem TSS (antes do histórico PMC), mostra só o km', () => {
    expect(describeWeek(semana({ distanceKm: 4, tss: null, activeDays: null }), DISPONIVEL).load).toBe('Carga 4,0 km');
  });

  it('adesão com "X de Y" e carga com dias com treino', () => {
    expect(describeWeek(semana(), DISPONIVEL)).toEqual({
      title: 'Semana de 21/09',
      adherence: 'Adesão 75% (3 de 4)',
      load: 'Carga 120 TSS · 3 dias com treino',
    });
  });

  it('um dia só fica no singular', () => {
    expect(describeWeek(semana({ activeDays: 1 }), DISPONIVEL).load).toBe('Carga 120 TSS · 1 dia com treino');
  });

  it('semana sem entrada de aderência → "Sem plano na semana"', () => {
    expect(describeWeek(semana({ adherence: null, planned: null, completed: null }), DISPONIVEL).adherence).toBe('Sem plano na semana');
  });

  it('semana ATUAL sem entrada de aderência → "Nada vencido ainda nesta semana", não "Sem plano" (CA7)', () => {
    expect(describeWeek(semana({ current: true, adherence: null, planned: null, completed: null }), DISPONIVEL).adherence)
      .toBe('Nada vencido ainda nesta semana');
  });

  it('consulta de aderência que falhou → "Dado indisponível", nunca "Sem plano na semana"', () => {
    const r = describeWeek(semana({ adherence: null, planned: null, completed: null }), { adherenceAvailable: false, pmcAvailable: true });
    expect(r.adherence).toBe('Adesão: dado indisponível');
  });

  it('consulta de PMC que falhou → carga indisponível', () => {
    const r = describeWeek(semana({ tss: null, activeDays: null }), { adherenceAvailable: true, pmcAvailable: false });
    expect(r.load).toBe('Carga: dado indisponível');
  });

  it('semana em curso é marcada no tooltip', () => {
    expect(describeWeek(semana({ current: true, adherence: 0, completed: 0 }), DISPONIVEL).adherence).toBe(
      'Adesão 0% (0 de 4) · semana em curso',
    );
  });

  it('semana na lacuna e semana atual', () => {
    const r = describeWeek(semana({ noData: true, tss: null, activeDays: null, current: true }), DISPONIVEL);
    expect(r).toMatchObject({ title: 'Semana de 21/09 (atual)', load: 'Sem treinos registrados' });
  });
});
