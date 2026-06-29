import { describe, expect, it } from 'vitest';
import { formFromTSB, getTsbFormaTone, FAIXA_APRESENTACAO } from './AthleteForm';
import type { FaixaTsbStatus } from '../../../types/FaixaTsb';

// Nota: formFromTSB/getTsbFormaTone permanecem só para a projeção de taper
// (calcularPrevisaoForma); a forma ATUAL consome statusForma via FAIXA_APRESENTACAO.
describe('formFromTSB', () => {
  it('form_excellent: TSB >= 15', () => {
    expect(formFromTSB(15)).toBe('form_excellent');
    expect(formFromTSB(30)).toBe('form_excellent');
  });

  it('form_good: TSB >= 5 e < 15 (BVA: 5, 14)', () => {
    expect(formFromTSB(5)).toBe('form_good');
    expect(formFromTSB(14)).toBe('form_good');
  });

  it('form_stable: TSB >= -10 e < 5 (BVA: -10, 4)', () => {
    expect(formFromTSB(-10)).toBe('form_stable');
    expect(formFromTSB(4)).toBe('form_stable');
  });

  it('form_low: TSB >= -20 e < -10 (BVA: -20, -11)', () => {
    expect(formFromTSB(-20)).toBe('form_low');
    expect(formFromTSB(-11)).toBe('form_low');
  });

  it('form_critical: TSB < -20 (BVA: -21) — alinhado com backend danger <= -20', () => {
    expect(formFromTSB(-21)).toBe('form_critical');
    expect(formFromTSB(-100)).toBe('form_critical');
  });
});

describe('getTsbFormaTone', () => {
  it('mapeia excellent e good para success', () => {
    expect(getTsbFormaTone('form_excellent')).toBe('success');
    expect(getTsbFormaTone('form_good')).toBe('success');
  });

  it('mapeia stable para neutral', () => {
    expect(getTsbFormaTone('form_stable')).toBe('neutral');
  });

  it('mapeia low para warning', () => {
    expect(getTsbFormaTone('form_low')).toBe('warning');
  });

  it('mapeia critical para danger', () => {
    expect(getTsbFormaTone('form_critical')).toBe('danger');
  });
});

describe('FAIXA_APRESENTACAO', () => {
  const faixas: FaixaTsbStatus[] = [
    'FADIGA_EXCESSIVA', 'FADIGA_ALTA', 'FADIGA_MODERADA', 'ACUMULANDO_FADIGA',
    'FATIGADO', 'RECUPERANDO', 'FORMA_IDEAL', 'DESCANSADO', 'MUITO_DESCANSADO',
  ];

  it('cobre as 9 faixas com label não-vazio e tom válido', () => {
    const tons = new Set(['neutral', 'success', 'warning', 'danger']);
    faixas.forEach((f) => {
      const apres = FAIXA_APRESENTACAO[f];
      expect(apres.label.trim().length).toBeGreaterThan(0);
      expect(tons.has(apres.tone)).toBe(true);
    });
  });

  it('mapeia os tons por severidade (danger/warning/neutral/success)', () => {
    expect(FAIXA_APRESENTACAO.FADIGA_EXCESSIVA.tone).toBe('danger');
    expect(FAIXA_APRESENTACAO.FADIGA_ALTA.tone).toBe('danger');
    expect(FAIXA_APRESENTACAO.FADIGA_MODERADA.tone).toBe('warning');
    expect(FAIXA_APRESENTACAO.ACUMULANDO_FADIGA.tone).toBe('warning');
    expect(FAIXA_APRESENTACAO.MUITO_DESCANSADO.tone).toBe('warning');
    expect(FAIXA_APRESENTACAO.FATIGADO.tone).toBe('neutral');
    expect(FAIXA_APRESENTACAO.RECUPERANDO.tone).toBe('neutral');
    expect(FAIXA_APRESENTACAO.FORMA_IDEAL.tone).toBe('success');
    expect(FAIXA_APRESENTACAO.DESCANSADO.tone).toBe('success');
  });
});
