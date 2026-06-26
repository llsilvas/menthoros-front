import { describe, expect, it } from 'vitest';
import { formFromTSB, getTsbFormaTone } from './AthleteForm';

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
