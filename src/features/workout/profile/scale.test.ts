import { describe, it, expect } from 'vitest';
import { scaleFor, zoneOf, normalize } from './scale';

describe('scaleFor — o esporte escolhe o denominador, não o desenho', () => {
  it('bike normaliza por FTP quando há limiar', () => {
    expect(scaleFor('bike', { ftpWatts: 250 })).toMatchObject({ metric: 'ftpPct', ceiling: 150 });
  });

  it('run normaliza por velocidade no limiar', () => {
    expect(scaleFor('run', { paceLimiarSecPerKm: 260 })).toMatchObject({ metric: 'pacePct', ceiling: 150 });
  });

  it('swim normaliza por CSS', () => {
    expect(scaleFor('swim', { cssSecPer100m: 95 })).toMatchObject({ metric: 'pacePct', ceiling: 150 });
  });

  it('sem limiar do esporte, cai para %FCmáx', () => {
    expect(scaleFor('run', { fcMax: 190 })).toMatchObject({ metric: 'hrPct', ceiling: 110 });
  });

  it('sem limiar nenhum, cai para RPE — o último recurso', () => {
    expect(scaleFor('run', {})).toMatchObject({ metric: 'rpe', ceiling: 10 });
    expect(scaleFor('run', undefined)).toMatchObject({ metric: 'rpe', ceiling: 10 });
  });
});

describe('zoneBreaks — 5 zonas Coggan sobre teto fixo', () => {
  // Teto fixo, e não o pico do próprio treino: é o que permite pôr dois treinos
  // lado a lado e ler a diferença. Normalizado pelo pico, todo treino pareceria
  // igualmente intenso.
  it('os quatro cortes do teto 150 batem com a tabela da spec §4.2', () => {
    const { zoneBreaks } = scaleFor('bike', { ftpWatts: 250 });
    // 60/150, 82/150, 97/150, 110/150
    expect(zoneBreaks[0]).toBeCloseTo(0.40, 2);
    expect(zoneBreaks[1]).toBeCloseTo(0.55, 2);
    expect(zoneBreaks[2]).toBeCloseTo(0.65, 2);
    expect(zoneBreaks[3]).toBeCloseTo(0.73, 2);
  });

  it('cada métrica traz os cortes na sua própria unidade', () => {
    expect(scaleFor('run', { fcMax: 190 }).zoneBreaks).not.toEqual(
      scaleFor('bike', { ftpWatts: 250 }).zoneBreaks,
    );
    expect(scaleFor('run', {}).zoneBreaks[0]).toBeCloseTo(0.30, 2); // RPE 3 de 10
  });
});

describe('zoneOf — a zona sai dos cortes, não de string matching', () => {
  const escala = scaleFor('bike', { ftpWatts: 250 });

  it.each([
    [0.20, 'Z1'],
    [0.39, 'Z1'],
    [0.40, 'Z2'],
    [0.54, 'Z2'],
    [0.55, 'Z3'],
    [0.64, 'Z3'],
    [0.65, 'Z4'],
    [0.72, 'Z4'],
    [0.74, 'Z5'],
    [1.00, 'Z5'],
  ])('intensidade %s cai em %s', (valor, esperada) => {
    expect(zoneOf(valor, escala)).toBe(esperada);
  });

  // Os cortes da spec (0.40 · 0.55 · 0.65 · 0.73) são arredondamentos de 60/150,
  // 82/150, 97/150 e 110/150. Asserir o valor arredondado como fronteira exata
  // erra por 0.003 no último — então a fronteira sai da própria escala.
  it('o limite é inclusivo à esquerda no valor exato do corte', () => {
    for (const corte of escala.zoneBreaks) {
      expect(zoneOf(corte - 1e-9, escala)).not.toBe(zoneOf(corte, escala));
    }
  });
});

describe('normalize — satura sem mentir', () => {
  const escala = scaleFor('bike', { ftpWatts: 250 });

  it('converte o valor da métrica em fração do teto', () => {
    expect(normalize(75, escala)).toBeCloseTo(0.5, 3);   // 75% de FTP sobre teto 150
    expect(normalize(150, escala)).toBeCloseTo(1, 3);
  });

  it('trava em 1 acima do teto — a barra satura, não transborda', () => {
    expect(normalize(200, escala)).toBe(1);
  });

  it('nunca devolve negativo', () => {
    expect(normalize(-10, escala)).toBe(0);
  });
});
