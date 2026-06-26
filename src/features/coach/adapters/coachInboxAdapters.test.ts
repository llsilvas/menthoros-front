import { describe, expect, it } from 'vitest';
import { calcularMonotonia, calcularLoadDelta, calcularAcwr } from './coachInboxAdapters';
import type { PmcPontoRaw } from '../../../types/AtletaPerfilCoach';

function pmc(over: Partial<PmcPontoRaw>): PmcPontoRaw {
  return { data: '2026-06-01', ctl: 50, atl: 55, tsb: -5, tss: 80, ...over };
}

describe('calcularMonotonia', () => {
  it('retorna 1.0 com menos de 3 pontos (fallback)', () => {
    expect(calcularMonotonia([])).toBe(1.0);
    expect(calcularMonotonia([pmc({ tss: 80 }), pmc({ tss: 90 })])).toBe(1.0);
  });

  it('retorna 1.0 quando stddev é zero (treinos idênticos)', () => {
    const pts = Array.from({ length: 7 }, () => pmc({ tss: 70 }));
    expect(calcularMonotonia(pts)).toBe(1.0);
  });

  it('calcula mean/stddev para série variada (BVA: exatamente 3 pontos)', () => {
    const pts = [pmc({ tss: 70 }), pmc({ tss: 80 }), pmc({ tss: 90 })];
    const result = calcularMonotonia(pts);
    expect(result).toBeGreaterThan(1.0);
    expect(result).toBeLessThan(15.0);
  });

  it('usa apenas os últimos 7 pontos de um array maior', () => {
    const pts = [
      pmc({ tss: 200 }), pmc({ tss: 200 }), pmc({ tss: 200 }),
      pmc({ tss: 70 }), pmc({ tss: 70 }), pmc({ tss: 70 }),
      pmc({ tss: 70 }), pmc({ tss: 70 }), pmc({ tss: 70 }), pmc({ tss: 70 }),
    ];
    expect(calcularMonotonia(pts)).toBe(1.0);
  });

  it('ignora pontos com tss zero ou ausente', () => {
    const pts = [pmc({ tss: 0 }), pmc({ tss: 0 }), pmc({ tss: 80 }), pmc({ tss: 90 })];
    expect(calcularMonotonia(pts)).toBe(1.0);
  });
});

describe('calcularLoadDelta', () => {
  it('retorna 0 com menos de 8 pontos (histórico insuficiente)', () => {
    const pts = Array.from({ length: 7 }, (_, i) => pmc({ ctl: 50 + i }));
    expect(calcularLoadDelta(pts)).toBe(0);
  });

  it('retorna 0 quando CTL da semana passada é zero (evita divisão por zero)', () => {
    const pts = Array.from({ length: 8 }, () => pmc({ ctl: 0 }));
    expect(calcularLoadDelta(pts)).toBe(0);
  });

  it('calcula delta positivo corretamente (BVA: exatamente 8 pontos)', () => {
    const pts = [pmc({ ctl: 50 }), ...Array.from({ length: 6 }, () => pmc({ ctl: 52 })), pmc({ ctl: 55 })];
    expect(calcularLoadDelta(pts)).toBe(10.0);
  });

  it('calcula delta negativo (carga em queda)', () => {
    const pts = [pmc({ ctl: 60 }), ...Array.from({ length: 6 }, () => pmc({ ctl: 58 })), pmc({ ctl: 54 })];
    expect(calcularLoadDelta(pts)).toBe(-10.0);
  });
});

describe('calcularAcwr', () => {
  it('retorna null quando atl ou ctl é null', () => {
    expect(calcularAcwr(null, 50)).toBeNull();
    expect(calcularAcwr(55, null)).toBeNull();
    expect(calcularAcwr(null, null)).toBeNull();
  });

  it('retorna null quando ctl é zero (evita divisão por zero)', () => {
    expect(calcularAcwr(55, 0)).toBeNull();
  });

  it('sweet spot: ATL = CTL → ACWR = 1.0', () => {
    expect(calcularAcwr(50, 50)).toBe(1.0);
  });

  it('zona ideal: ATL < CTL → ACWR < 1 (atleta descansando)', () => {
    expect(calcularAcwr(40, 50)).toBe(0.8);
  });

  it('zona de risco: ATL muito maior que CTL → ACWR > 1.5', () => {
    expect(calcularAcwr(90, 50)).toBe(1.8);
  });

  it('BVA: limiar exato 1.5 (fronteira atenção/risco)', () => {
    expect(calcularAcwr(75, 50)).toBe(1.5);
  });

  it('BVA: limiar exato 1.3 (fronteira ideal/atenção)', () => {
    expect(calcularAcwr(65, 50)).toBe(1.3);
  });
});
