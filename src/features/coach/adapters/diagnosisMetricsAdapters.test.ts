import { describe, expect, it } from 'vitest';
import { buildDiagnosisMetrics } from './diagnosisMetricsAdapters';
import type { CoachAthleteRow } from '../types/CoachInbox';

function atleta(stats: Partial<CoachAthleteRow['quickStats']> = {}, over: Partial<CoachAthleteRow> = {}): CoachAthleteRow {
  return {
    raceCalendar: [{ date: '18 out', label: 'Mizuno', tag: 'ALVO' }],
    racePrediction: { diasAteProva: 20, tsbPrevisto: 3.24, formaPrevista: 'form_stable' },
    quickStats: {
      hasWindowData: true,
      acuteLoad: 21.14,
      monotony: 1.62,
      trainingDays7d: 4,
      strain: 612,
      ...stats,
    },
    ...over,
  } as unknown as CoachAthleteRow;
}

const porChave = (row: CoachAthleteRow) => Object.fromEntries(buildDiagnosisMetrics(row).map((m) => [m.key, m]));

describe('buildDiagnosisMetrics', () => {
  it('quatro métricas na ordem, com qualificador', () => {
    expect(buildDiagnosisMetrics(atleta()).map((m) => [m.label, m.qualifier])).toEqual([
      ['Carga aguda', 'ATL'],
      ['Monotonia', '7 dias'],
      ['Strain', '7 dias'],
      ['Forma prevista', 'na prova'],
    ]);
  });

  /** ATL é TSS/dia. Antes saía como "21,1 km" e era comparado com um limiar de 120 km. */
  it('carga aguda em TSS/dia, tom neutro', () => {
    expect(porChave(atleta()).acuteLoad).toMatchObject({ value: '21,1 TSS/dia', tone: 'neutral', badge: null });
    expect(porChave(atleta({ acuteLoad: null })).acuteLoad).toMatchObject({ value: '—', tone: 'neutral' });
  });

  it('monotonia com vírgula, base de dias e tom pelo limiar', () => {
    expect(porChave(atleta()).monotony).toMatchObject({ value: '1,62', tone: 'warning' });
    expect(porChave(atleta()).monotony.detail).toContain('4 dias com treino');
    expect(porChave(atleta({ monotony: 1.2 })).monotony.tone).toBe('success');
  });

  it('monotonia e strain sem base: sem número, dizendo quantos dias houve', () => {
    const m = porChave(atleta({ monotony: null, strain: null, trainingDays7d: 1 }));
    expect(m.monotony).toMatchObject({ value: '—', detail: 'Sem base: 1 dia com treino (mínimo 3)', tone: 'neutral' });
    expect(m.strain).toMatchObject({ value: '—', detail: 'Sem base: 1 dia com treino (mínimo 3)', tone: 'neutral' });
  });

  it('strain com a zona e a fórmula na linha de apoio', () => {
    expect(porChave(atleta()).strain).toMatchObject({ value: '612', tone: 'danger' });
    expect(porChave(atleta()).strain.detail).toMatch(/^Crítico · /);
    expect(porChave(atleta({ strain: 1450 })).strain.value).toBe('1.450');
  });

  it('forma prevista na prova: faixa, TSB projetado e prazo', () => {
    expect(porChave(atleta()).racePrediction).toMatchObject({
      value: 'Estável',
      detail: 'TSB +3,2 em 20 dias, sem carga até a prova',
      tone: 'neutral',
    });
    expect(porChave(atleta({}, { racePrediction: { diasAteProva: 1, tsbPrevisto: -22, formaPrevista: 'form_critical' } })).racePrediction)
      .toMatchObject({ value: 'Muito baixa', detail: 'TSB -22,0 em 1 dia, sem carga até a prova', tone: 'danger' });
  });

  it('sem prova futura: diz isso, sem número', () => {
    expect(porChave(atleta({}, { racePrediction: null, raceCalendar: [] })).racePrediction)
      .toMatchObject({ value: '—', detail: 'Sem prova futura cadastrada', tone: 'neutral' });
  });
});
