import { describe, expect, it } from 'vitest';
import { calcularMonotonia, calcularLoadDelta, calcularAcwr, getAcwrZone, getAcuteLoadTone, getMonotonyTone, calcularStrain, getStrainZone } from './coachInboxAdapters';
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

describe('getAcwrZone', () => {
  it('null → neutral / Sem dados', () => {
    expect(getAcwrZone(null)).toEqual({ tone: 'neutral', label: 'Sem dados' });
  });

  it('> 1.5 → danger / Risco', () => {
    expect(getAcwrZone(1.8)).toEqual({ tone: 'danger', label: 'Risco' });
  });

  it('BVA: 1.5 ainda é Atenção (limiar é > 1.5)', () => {
    expect(getAcwrZone(1.5)).toEqual({ tone: 'warning', label: 'Atenção' });
    expect(getAcwrZone(1.51)).toEqual({ tone: 'danger', label: 'Risco' });
  });

  it('1.3 < acwr <= 1.5 → warning / Atenção', () => {
    expect(getAcwrZone(1.4)).toEqual({ tone: 'warning', label: 'Atenção' });
  });

  it('BVA: 1.3 é Ideal (limiar é > 1.3)', () => {
    expect(getAcwrZone(1.3)).toEqual({ tone: 'success', label: 'Ideal' });
  });

  it('0.8 <= acwr <= 1.3 → success / Ideal', () => {
    expect(getAcwrZone(1.0)).toEqual({ tone: 'success', label: 'Ideal' });
    expect(getAcwrZone(0.8)).toEqual({ tone: 'success', label: 'Ideal' });
  });

  it('< 0.8 → warning / Muito baixo', () => {
    expect(getAcwrZone(0.5)).toEqual({ tone: 'warning', label: 'Muito baixo' });
  });
});

describe('getAcuteLoadTone', () => {
  it('BVA: 120 ainda é success (limiar é > 120)', () => {
    expect(getAcuteLoadTone(120)).toBe('success');
    expect(getAcuteLoadTone(121)).toBe('warning');
  });
});

describe('getMonotonyTone', () => {
  it('BVA: 1.4 ainda é success (limiar é > 1.4)', () => {
    expect(getMonotonyTone(1.4)).toBe('success');
    expect(getMonotonyTone(1.5)).toBe('warning');
  });
});

describe('calcularStrain', () => {
  it('retorna null com menos de 3 pontos de TSS', () => {
    expect(calcularStrain([])).toBeNull();
    expect(calcularStrain([pmc({ tss: 80 }), pmc({ tss: 90 })])).toBeNull();
  });

  it('retorna null quando todos os tss são zero', () => {
    const pts = Array.from({ length: 7 }, () => pmc({ tss: 0 }));
    expect(calcularStrain(pts)).toBeNull();
  });

  it('strain = TSS_semanal × monotonia para treinos idênticos (monotonia=1.0)', () => {
    // 7 × 70 = 490, monotonia 1.0 → 490
    const pts = Array.from({ length: 7 }, () => pmc({ tss: 70 }));
    expect(calcularStrain(pts)).toBe(490);
  });

  it('strain supera o TSS semanal quando há variabilidade (monotonia > 1)', () => {
    const pts = [
      pmc({ tss: 30 }), pmc({ tss: 30 }), pmc({ tss: 150 }),
      pmc({ tss: 30 }), pmc({ tss: 150 }), pmc({ tss: 30 }), pmc({ tss: 150 }),
    ];
    const tssSemanal = 30 + 30 + 150 + 30 + 150 + 30 + 150; // 570
    expect(calcularStrain(pts)).toBeGreaterThan(tssSemanal);
  });
});

describe('getStrainZone', () => {
  it('null → neutral / Sem dados', () => {
    expect(getStrainZone(null)).toEqual({ tone: 'neutral', label: 'Sem dados' });
  });

  it('< 150 → neutral / Baixo', () => {
    expect(getStrainZone(100)).toEqual({ tone: 'neutral', label: 'Baixo' });
  });

  it('BVA: 150 → success / Moderado', () => {
    expect(getStrainZone(149)).toEqual({ tone: 'neutral', label: 'Baixo' });
    expect(getStrainZone(150)).toEqual({ tone: 'success', label: 'Moderado' });
  });

  it('BVA: 300 → warning / Alto', () => {
    expect(getStrainZone(299)).toEqual({ tone: 'success', label: 'Moderado' });
    expect(getStrainZone(300)).toEqual({ tone: 'warning', label: 'Alto' });
  });

  it('BVA: 600 → danger / Crítico', () => {
    expect(getStrainZone(599)).toEqual({ tone: 'warning', label: 'Alto' });
    expect(getStrainZone(600)).toEqual({ tone: 'danger', label: 'Crítico' });
  });
});
