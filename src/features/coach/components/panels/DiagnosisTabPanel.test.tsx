import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiagnosisTabPanel } from './DiagnosisTabPanel';
import type { CoachAthleteRow } from '../../types/CoachInbox';

function atleta(over: Partial<CoachAthleteRow> = {}): CoachAthleteRow {
  return {
    id: 'a1',
    name: 'Ana Silva',
    discipline: 'Corrida',
    age: 30,
    nivelExperiencia: null,
    gender: 'F',
    weeksOnPlan: 4,
    segment: 'attention',
    planStatus: 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: 'No prazo',
    decision: 'PENDING',
    adherence: 62,
    load7d: 40,
    loadDelta: -5,
    delay: 1,
    nextWorkout: { title: 'Longão', when: 'sáb', zone: 'Z2', duration: '60min', distance: '10km', objective: 'Base' },
    raceCalendar: [],
    loadTrend: [30, 35, 40],
    adherenceTrend: [70, 65, 62],
    notes: 'Aderência caiu 20% nas últimas duas semanas.',
    suggestedActions: ['Reduzir volume', 'Conversar sobre a rotina'],
    quickStats: {
      acuteLoad: 120,
      monotony: 1.4,
      strain: 200,
      recovery: 75,
      acwr: 1.1,
      statusForma: null,
    },
    racePrediction: null,
    ...over,
  } as CoachAthleteRow;
}

const posicaoDe = (texto: RegExp) => {
  const elemento = screen.getByText(texto);
  return Array.from(document.querySelectorAll('*')).indexOf(elemento);
};

describe('DiagnosisTabPanel', () => {
  /**
   * UX-002 da auditoria: o insight da IA — o *porquê* — ficava no fim do painel, depois de todas as
   * métricas e gráficos. O coach decide pelo motivo, não pelo número cru; a métrica é evidência do
   * insight, não o contrário. Este teste fixa a ordem para que ninguém a reverta sem notar.
   */
  it('mostra os sinais de atenção ANTES das métricas', () => {
    render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

    expect(posicaoDe(/sinais de atenção/i)).toBeLessThan(posicaoDe(/carga aguda/i));
  });

  it('mostra os sinais de atenção ANTES das tendências', () => {
    render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

    expect(posicaoDe(/sinais de atenção/i)).toBeLessThan(posicaoDe(/tendência de carga/i));
  });

  it('exibe o diagnóstico e as ações sugeridas do atleta', () => {
    render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

    expect(screen.getByText(/aderência caiu 20%/i)).toBeInTheDocument();
    expect(screen.getByText(/reduzir volume/i)).toBeInTheDocument();
  });
});
