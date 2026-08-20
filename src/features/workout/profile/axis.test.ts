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

  // Acima de uma hora o rótulo sai em h:mm — o passo é o mesmo, a unidade é que
  // deixou de se misturar na régua.
  it.each([
    [900,   '2'],     // 15min -> passo 2
    [1800,  '5'],     // 30min -> passo 5
    [3600,  '10'],    // 60min -> passo 10
    [7200,  '0:15'],  // 2h    -> passo 15
    [14400, '0:30'],  // 4h    -> passo 30
  ])('escolhe o passo pela duração: %s segundos usa passo de %s', (total, primeiroPasso) => {
    expect(rotulos(total)[1]).toBe(primeiroPasso);
  });

  // Achado da navegação: um treino de 1h15 mostrava "0 10 20 30 40 50 1:00
  // 1:10 1:15" — duas unidades na mesma régua, e o leitor trocando de sistema
  // no meio do eixo.
  it('acima de uma hora, TODOS os rótulos ficam em h:mm', () => {
    const ticks = rotulos(7200);
    expect(ticks[0]).toBe('0:00');
    expect(ticks).toContain('0:15');
    expect(ticks).toContain('1:00');
    expect(ticks[ticks.length - 1]).toBe('2:00');
    // Nenhum rótulo em minutos crus sobrando.
    expect(ticks.every((r) => r.includes(':'))).toBe(true);
  });

  it('abaixo de uma hora segue em minutos, onde não há ambiguidade', () => {
    expect(rotulos(2400).every((r) => !r.includes(':'))).toBe(true);
  });

  // 75 − 70 = 5, que é exatamente meio passo: a comparação `<` não suprimia, e
  // "1:10" colidia com "1:15".
  it('suprime o penúltimo tick quando ele encosta no total', () => {
    const ticks = rotulos(4500); // 1h15
    expect(ticks).not.toContain('1:10');
    expect(ticks[ticks.length - 1]).toBe('1:15');
  });

  it('nenhum par de ticks fica a menos de meio passo de distância', () => {
    for (const total of [2400, 2530, 4500, 7200, 9000]) {
      const ticks = xAxisTicks(total);
      const passoMin = (ticks[1]?.ratio ?? 1) * (total / 60);
      for (let i = 1; i < ticks.length; i++) {
        const distancia = (ticks[i].ratio - ticks[i - 1].ratio) * (total / 60);
        expect(distancia, `${total}s: ${ticks[i - 1].label}→${ticks[i].label}`)
          .toBeGreaterThan(passoMin / 2);
      }
    }
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
