import { describe, it, expect } from 'vitest';
import { formatDuration, formatWorkRatio, formatTarget } from './format';

describe('formatDuration', () => {
  it.each([
    [30, '30 s'],
    [60, '1 min'],
    [180, '3 min'],
    [2400, '40 min'],
    [3600, '1h'],
    [5400, '1h30'],
    [7260, '2h01'],
  ])('%s segundos vira "%s"', (sec, esperado) => {
    expect(formatDuration(sec)).toBe(esperado);
  });
});

describe('formatWorkRatio — o treinador enuncia o treino em proporção inteira', () => {
  // "trabalho 3:2" é como se fala do treino; "1.5" não é. A leitura decimal
  // obriga o treinador a converter de cabeça o que ele já sabe dizer.
  it.each([
    [1.5, 'trabalho 3:2'],
    [2, 'trabalho 2:1'],
    [1, 'trabalho 1:1'],
    [0.5, 'trabalho 1:2'],
    [1.3333333, 'trabalho 4:3'],
  ])('razão %s vira "%s"', (razao, esperado) => {
    expect(formatWorkRatio(razao)).toBe(esperado);
  });

  it('não inventa proporção quando não há recuperação', () => {
    expect(formatWorkRatio(null)).toBeNull();
  });

  it('arredonda para a proporção inteira mais próxima em razões quebradas', () => {
    expect(formatWorkRatio(1.61)).toMatch(/^trabalho \d+:\d+$/);
  });
});

describe('formatTarget — cada esporte prescreve na sua moeda', () => {
  it.each([
    [{ kind: 'ftpPct' as const, from: 88, to: 94 }, '88–94% FTP'],
    [{ kind: 'ftpPct' as const, from: 90 }, '90% FTP'],
    [{ kind: 'powerW' as const, from: 250, to: 270 }, '250–270 W'],
    [{ kind: 'hrPct' as const, from: 70, to: 80, basis: 'max' as const }, '70–80% FCmáx'],
    [{ kind: 'pace' as const, fromSecPerKm: 258, toSecPerKm: 264 }, '4:18–4:24 /km'],
    [{ kind: 'pace' as const, fromSecPerKm: 400 }, '6:40 /km'],
    [{ kind: 'pace100' as const, fromSecPer100m: 95 }, '1:35 /100m'],
    [{ kind: 'rpe' as const, value: 7 }, 'RPE 7'],
  ])('formata %o como "%s"', (target, esperado) => {
    expect(formatTarget(target)).toBe(esperado);
  });

  it('sem prescrição, não devolve texto nenhum', () => {
    expect(formatTarget({ kind: 'none' })).toBeNull();
  });
});
