import { describe, it, expect } from 'vitest';
import { xAxisTicks, zoneBands } from './axis';
import { scaleFor } from './scale';

const rotulos = (totalSec: number) => xAxisTicks(totalSec).map((t) => t.label);

describe('xAxisTicks — AC-4: o eixo tem marcas intermediárias', () => {
  // O componente antigo mostrava só os extremos: o treinador via "0" e "40min"
  // e não tinha como situar o bloco do meio no tempo.
  it('um treino de 40min ganha passo de 5min, do 0 ao total', () => {
    expect(rotulos(2400)).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40']);
  });

  it('o último tick é sempre a duração exata, mesmo fora do passo', () => {
    const ticks = rotulos(2820); // 47min
    expect(ticks[ticks.length - 1]).toBe('47');
  });

  it('suprime o penúltimo quando o total cairia em cima dele', () => {
    const ticks = rotulos(2530); // 42min10s — o "40" ficaria colado no "42"
    expect(ticks).not.toContain('40');
    expect(ticks[ticks.length - 1]).toBe('42');
  });

  it.each([
    [900,   '2'],   // 15min  -> passo 2
    [1800,  '5'],   // 30min  -> passo 5
    [3600,  '10'],  // 60min  -> passo 10
    [7200,  '15'],  // 2h     -> passo 15
    [14400, '30'],  // 4h     -> passo 30
  ])('escolhe o passo pela duração: %s segundos usa passo de %s min', (total, primeiroPasso) => {
    expect(rotulos(total)[1]).toBe(primeiroPasso);
  });

  it('passa a h:mm acima de uma hora', () => {
    const ticks = rotulos(7200);
    expect(ticks).toContain('1:00');
    expect(ticks[ticks.length - 1]).toBe('2:00');
  });

  // A §4.6 da spec diz "4 a 7 rótulos", mas a tabela de passos da mesma seção
  // gera 9 num treino de 40min — e o AC-4 exige exatamente esses 9 (0, 5, …, 40).
  // O critério numerado manda sobre a prosa; o que se garante aqui é que a grade
  // não explode nem colapsa em nenhuma duração real.
  it('mantém a grade entre 3 e 11 rótulos em qualquer duração usual', () => {
    for (const total of [600, 1200, 2400, 2700, 3600, 5400, 9000, 14400]) {
      const n = xAxisTicks(total).length;
      expect(n, `${total}s gerou ${n} ticks`).toBeGreaterThanOrEqual(3);
      expect(n, `${total}s gerou ${n} ticks`).toBeLessThanOrEqual(11);
    }
  });

  it('devolve vazio para treino sem duração', () => {
    expect(xAxisTicks(0)).toEqual([]);
  });

  it('posiciona cada tick pela fração do total', () => {
    const ticks = xAxisTicks(2400);
    expect(ticks[0].ratio).toBe(0);
    expect(ticks[ticks.length - 1].ratio).toBe(1);
  });
});

describe('zoneBands — o rótulo fica no centro da faixa, não sobre a linha', () => {
  const escala = scaleFor('bike', { ftpWatts: 250 });

  it('devolve as cinco zonas', () => {
    expect(zoneBands(escala).map((f) => f.zone)).toEqual(['Z1', 'Z2', 'Z3', 'Z4', 'Z5']);
  });

  it('centra cada rótulo entre os limites da própria faixa', () => {
    const [z1, z2] = zoneBands(escala);
    expect(z1.center).toBeCloseTo(escala.zoneBreaks[0] / 2, 6);
    expect(z2.center).toBeCloseTo((escala.zoneBreaks[0] + escala.zoneBreaks[1]) / 2, 6);
  });

  it('as faixas cobrem 0..1 sem buraco nem sobreposição', () => {
    const faixas = zoneBands(escala);
    expect(faixas[0].from).toBe(0);
    expect(faixas[faixas.length - 1].to).toBe(1);
    for (let i = 1; i < faixas.length; i++) {
      expect(faixas[i].from).toBe(faixas[i - 1].to);
    }
  });
});
