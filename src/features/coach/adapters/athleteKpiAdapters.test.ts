import { describe, expect, it } from 'vitest';
import { buildAthleteKpis, buildNextRaceHeader } from './athleteKpiAdapters';
import type { CoachAthleteRow } from '../types/CoachInbox';

function atleta(over: Partial<CoachAthleteRow> = {}, stats: Partial<CoachAthleteRow['quickStats']> = {}): CoachAthleteRow {
  const base = {
    adherence: 38,
    adherenceAvailable: true,
    adherenceWindow: { percent: 31, completed: 5, planned: 16, weeks: 4 },
    load7d: 5,
    loadDelta: 36.2,
    quickStats: {
      hasWindowData: true,
      acuteLoad: 21.1,
      monotony: 1.2,
      tsb: -8.64,
      statusForma: 'FATIGADO',
      acwr: 1.97,
      acwrConfidence: { level: 'BAIXA', reason: 'Base crônica incompleta: 60 dias sem treinos registrados' },
      strain: null,
      recovery: 50,
      ...stats,
    },
  };
  return { ...base, ...over } as unknown as CoachAthleteRow;
}

const FATIGADO = { label: 'Fatigado', tone: 'neutral' } as const;
const porChave = (row: CoachAthleteRow, rosterFallback: number | null = null) =>
  Object.fromEntries(buildAthleteKpis(row, FATIGADO, rosterFallback).map((k) => [k.key, k]));

describe('buildAthleteKpis', () => {
  it('quatro células na ordem da Proposta, com qualificador', () => {
    expect(buildAthleteKpis(atleta(), FATIGADO, null).map((k) => [k.label, k.qualifier])).toEqual([
      ['Aderência', '4 sem'],
      ['Carga', '7 dias'],
      ['Forma', 'TSB'],
      ['ACWR', null],
    ]);
  });

  it('aderência mostra a conta da janela, no tom das barras', () => {
    expect(porChave(atleta()).adherence).toMatchObject({ value: '31%', detail: '5 de 16 treinos planejados', tone: 'warning' });
  });

  it('aderência sem janela e sem perfil cai no roster', () => {
    expect(porChave(atleta({ adherenceWindow: null }), 38).adherence).toMatchObject({ value: '38%', detail: 'Últimas 4 semanas' });
  });

  it('aderência sem janela, com perfil: sem plano, sem número do roster', () => {
    expect(porChave(atleta({ adherenceWindow: null }), null).adherence).toMatchObject({ value: '—', detail: 'Sem plano na janela', tone: 'neutral' });
  });

  it('consulta de aderência que falhou: "Dado indisponível"', () => {
    expect(porChave(atleta({ adherenceAvailable: false }), 38).adherence).toMatchObject({ value: '—', detail: 'Dado indisponível', tone: 'neutral' });
  });

  it('carga: km no valor, delta em TSS arredondado e em pt-BR; ≥ 10% é atenção', () => {
    expect(porChave(atleta()).load).toMatchObject({ detail: 'TSS +36% vs. 7 dias anteriores', tone: 'warning' });
    expect(porChave(atleta({ loadDelta: 4 })).load.tone).toBe('success');
    expect(porChave(atleta({ loadDelta: -12.4 })).load.detail).toBe('TSS -12% vs. 7 dias anteriores');
  });

  it('carga sem base anterior é neutra', () => {
    expect(porChave(atleta({ loadDelta: null })).load).toMatchObject({ tone: 'neutral', detail: 'Sem carga nos 7 dias anteriores para comparar' });
  });

  it('forma usa a faixa do backend e TSB em pt-BR com 1 casa', () => {
    expect(porChave(atleta()).form).toMatchObject({ value: 'Fatigado', detail: 'TSB -8,6', tone: 'neutral' });
  });

  it('ACWR com baixa confiança: neutro, selo e motivo', () => {
    expect(porChave(atleta()).acwr).toMatchObject({
      value: '1,97',
      tone: 'neutral',
      badge: 'Baixa confiança',
      detail: 'Base crônica incompleta: 60 dias sem treinos registrados',
    });
  });

  it('ACWR com base completa segue a zona', () => {
    const kpi = porChave(atleta({}, { acwr: 1.74, acwrConfidence: { level: 'ALTA', reason: null } })).acwr;
    expect(kpi).toMatchObject({ value: '1,74', tone: 'danger', badge: null });
    expect(kpi.detail).toMatch(/^Risco/);
  });

  it('ACWR ausente com série presente: "Dado insuficiente"', () => {
    expect(porChave(atleta({}, { acwr: null })).acwr).toMatchObject({ value: '—', detail: 'Dado insuficiente', tone: 'neutral' });
  });

  it('sem dado na janela (PMC vazio) atinge Carga, Forma e ACWR — a aderência mantém o valor', () => {
    const kpis = porChave(atleta({}, { hasWindowData: false }));
    for (const key of ['load', 'form', 'acwr']) {
      expect(kpis[key]).toMatchObject({ value: '—', detail: 'Sem dado na janela', tone: 'neutral', badge: null });
    }
    expect(kpis.adherence).toMatchObject({ value: '31%', detail: '5 de 16 treinos planejados' });
  });
});

describe('buildNextRaceHeader', () => {
  const prova = { date: '18 out', label: 'Mizuno Athenas Run Longer 2026', tag: 'ALVO' as const };

  it('prova alvo com contagem', () => {
    expect(buildNextRaceHeader(prova, 20)).toEqual({ label: 'Prova alvo', name: prova.label, when: '18 out · em 20 dias', isTarget: true });
  });

  it('amanhã, hoje e sem contagem', () => {
    expect(buildNextRaceHeader(prova, 1)?.when).toBe('18 out · amanhã');
    expect(buildNextRaceHeader(prova, 0)?.when).toBe('18 out · hoje');
    expect(buildNextRaceHeader({ ...prova, tag: 'PRINCIPAL' }, -1)).toMatchObject({ label: 'Próxima prova', when: '18 out', isTarget: false });
  });

  it('sem prova → null', () => {
    expect(buildNextRaceHeader(null, -1)).toBeNull();
  });
});
