import { describe, expect, it } from 'vitest';
import { addDays, parseISO } from 'date-fns';
import { buildPmcChartModel } from './pmcChartModel';
import type { PMCDataPoint } from './pmcChartModel';

const d = (iso: string) => parseISO(iso);
/** O eixo termina em hoje — não no último ponto da série. */
const HOJE = d('2026-09-28');

function serie(inicio: string, dias: number, pular: (i: number) => boolean = () => false): PMCDataPoint[] {
  const out: PMCDataPoint[] = [];
  for (let i = 0; i < dias; i += 1) {
    if (pular(i)) continue;
    out.push({ date: addDays(d(inicio), i), tss: 10, ctl: 40 + i, atl: 30 + i, tsb: 10 });
  }
  return out;
}

describe('buildPmcChartModel', () => {
  it('série vazia → modelo vazio', () => {
    expect(buildPmcChartModel([], [], '12w', HOJE)).toEqual({ rows: [], ticks: [], gapAreas: [], latest: null });
  });

  it('filtra pelo período terminando em hoje', () => {
    const m = buildPmcChartModel(serie('2026-06-01', 120), [], '4w', HOJE);
    expect(m.rows).toHaveLength(28);
    expect(m.rows[27].t).toBe(d('2026-09-28').getTime());
  });

  it('densifica dias ausentes como missing', () => {
    const m = buildPmcChartModel(serie('2026-09-01', 28, (i) => i === 4), [], '4w', HOJE);
    expect(m.rows).toHaveLength(28);
    expect(m.rows[4]).toMatchObject({ missing: true, ctl: null, ctlSolid: null });
  });

  it('ticks semanais contados do último dia', () => {
    const m = buildPmcChartModel(serie('2026-06-01', 120), [], '4w', HOJE);
    expect(m.ticks).toEqual([0, 7, 14, 21].map((k) => addDays(d('2026-09-07'), k).getTime()));
  });

  it('lacuna: sólido some, estimado cobre a lacuna e os vizinhos', () => {
    const gaps = [{ start: d('2026-09-10'), end: d('2026-09-12') }];
    const m = buildPmcChartModel(serie('2026-09-01', 28), gaps, '4w', HOJE);
    const dia = (iso: string) => m.rows.find((r) => r.t === d(iso).getTime())!;

    expect(m.gapAreas).toEqual([{ x1: d('2026-09-10').getTime(), x2: d('2026-09-12').getTime() }]);
    expect(dia('2026-09-11')).toMatchObject({ inGap: true, ctlSolid: null });
    expect(dia('2026-09-11').ctlEst).not.toBeNull();
    expect(dia('2026-09-09').ctlEst).not.toBeNull();
    expect(dia('2026-09-09').ctlSolid).not.toBeNull();
    expect(dia('2026-09-05').ctlEst).toBeNull();
  });

  it('latest é o último dia com valores', () => {
    const m = buildPmcChartModel(serie('2026-09-01', 10), [], '4w', HOJE);
    expect(m.latest?.t).toBe(d('2026-09-10').getTime());
  });

  it('série esparsa que parou há 12 dias: o eixo vai até hoje e a lacuna aberta aparece', () => {
    // Último registro em 16/09; o backend não manda nada depois disso.
    const dados = serie('2026-09-01', 16);
    const gaps = [{ start: d('2026-09-17'), end: HOJE }];
    const m = buildPmcChartModel(dados, gaps, '4w', HOJE);

    expect(m.rows[m.rows.length - 1].t).toBe(HOJE.getTime());
    expect(m.gapAreas).toEqual([{ x1: d('2026-09-17').getTime(), x2: HOJE.getTime() }]);
  });

  it('lacuna aberta sem valores do backend: sem linha no trecho, nada inventado', () => {
    const m = buildPmcChartModel(serie('2026-09-01', 16), [{ start: d('2026-09-17'), end: HOJE }], '4w', HOJE);
    const semValor = m.rows.filter((r) => r.t > d('2026-09-16').getTime());

    expect(semValor.length).toBeGreaterThan(0);
    for (const r of semValor) {
      expect(r).toMatchObject({ missing: true, inGap: true, ctlSolid: null, ctlEst: null, tsbEst: null });
    }
    // O tracejado só aparece onde o backend enviou valor: o último dia real, vizinho da lacuna.
    expect(m.rows.find((r) => r.t === d('2026-09-16').getTime())?.ctlEst).not.toBeNull();
  });

  it('ticks semanais contados de hoje', () => {
    const m = buildPmcChartModel(serie('2026-09-01', 16), [], '4w', HOJE);
    expect(m.ticks[m.ticks.length - 1]).toBe(HOJE.getTime());
  });
});
