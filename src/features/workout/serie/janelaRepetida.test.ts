import { describe, it, expect } from 'vitest';
import { detectarJanelaRepetida } from './janelaRepetida';

/** Etapa mínima para o teste: um tipo e uma duração. */
type Etapa = { tipo: string; min: number };

const e = (tipo: string, min: number): Etapa => ({ tipo, min });

const opcoes = {
  assinatura: (x: Etapa) => `${x.tipo}|${x.min}`,
  ehTrabalho: (x: Etapa) => x.tipo === 'FORTE',
};

const detectar = (etapas: Etapa[]) => detectarJanelaRepetida(etapas, 0, etapas.length, opcoes);

describe('detectarJanelaRepetida', () => {
  it('encontra a série de pares repetidos', () => {
    const etapas = Array.from({ length: 5 }, () => [e('FORTE', 3), e('LEVE', 2)]).flat();
    expect(detectar(etapas)).toEqual({ janela: 2, reps: 5 });
  });

  it('encontra série de janela 1', () => {
    expect(detectar([e('FORTE', 1), e('FORTE', 1), e('FORTE', 1)])).toEqual({ janela: 1, reps: 3 });
  });

  // Sem esforço na janela, a repetição é coincidência, não série: dois blocos de
  // aquecimento iguais não viram um "2×".
  it('não agrupa repetição sem trabalho dentro', () => {
    expect(detectar([e('LEVE', 2), e('LEVE', 2), e('LEVE', 2)])).toBeNull();
  });

  it('não agrupa quando não há repetição', () => {
    expect(detectar([e('FORTE', 3), e('LEVE', 2), e('FORTE', 5)])).toBeNull();
  });

  it('prefere a janela que cobre mais etapas', () => {
    // 3 pares (cobre 6) vence 2 pares de janela maior que cobriria menos.
    const etapas = [
      e('FORTE', 3), e('LEVE', 2),
      e('FORTE', 3), e('LEVE', 2),
      e('FORTE', 3), e('LEVE', 2),
    ];
    expect(detectar(etapas)).toEqual({ janela: 2, reps: 3 });
  });

  it('respeita o limite: não atravessa a fronteira informada', () => {
    const etapas = [e('FORTE', 3), e('LEVE', 2), e('FORTE', 3), e('LEVE', 2)];
    expect(detectarJanelaRepetida(etapas, 0, 2, opcoes)).toBeNull();
  });

  it('começa a partir do índice informado', () => {
    const etapas = [
      e('AQUEC', 10),
      e('FORTE', 3), e('LEVE', 2),
      e('FORTE', 3), e('LEVE', 2),
    ];
    expect(detectarJanelaRepetida(etapas, 1, etapas.length, opcoes)).toEqual({ janela: 2, reps: 2 });
  });

  it('a assinatura decide o que conta como igual', () => {
    const etapas = [e('FORTE', 3), e('LEVE', 2), e('FORTE', 4), e('LEVE', 2)];
    // Com duração na assinatura, 3 e 4 são diferentes: não há série.
    expect(detectar(etapas)).toBeNull();
    // Sem duração, viram iguais.
    expect(detectarJanelaRepetida(etapas, 0, etapas.length, {
      assinatura: (x) => x.tipo,
      ehTrabalho: opcoes.ehTrabalho,
    })).toEqual({ janela: 2, reps: 2 });
  });

  it('lida com lista vazia e com uma etapa só', () => {
    expect(detectar([])).toBeNull();
    expect(detectar([e('FORTE', 3)])).toBeNull();
  });
});
