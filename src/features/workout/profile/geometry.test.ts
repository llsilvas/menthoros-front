import { describe, it, expect } from 'vitest';
import { layoutBlocks, heightOf, PISO_LARGURA_PX, PISO_ALTURA } from './geometry';

const bloco = (durationSec: number, intensityNormalized = 0.5) => ({ durationSec, intensityNormalized });

describe('layoutBlocks — largura', () => {
  it('reparte a largura proporcionalmente à duração', () => {
    const { blocks } = layoutBlocks([bloco(600), bloco(600), bloco(1200)], 600);
    expect(blocks.map((b) => b.width)).toEqual([150, 150, 300]);
  });

  it('encosta um bloco no outro — não existe gap no eixo', () => {
    const { blocks } = layoutBlocks([bloco(600), bloco(600), bloco(1200)], 600);
    expect(blocks.map((b) => b.x)).toEqual([0, 150, 300]);
  });

  // Um bloco de 30s num treino de 60min pede 0,8% da largura. Sem piso, ele
  // some — e uma etapa invisível é uma etapa que o treinador não revisou.
  it('dá piso de 3px ao bloco curto demais para aparecer', () => {
    const { blocks } = layoutBlocks([bloco(30), bloco(3570)], 600);
    expect(blocks[0].width).toBeGreaterThanOrEqual(PISO_LARGURA_PX);
  });

  it('desconta o piso dos blocos que sobram, preservando a largura total', () => {
    const { blocks } = layoutBlocks([bloco(30), bloco(30), bloco(3540)], 600);
    const soma = blocks.reduce((s, b) => s + b.width, 0);
    expect(soma).toBeCloseTo(600, 6);
  });

  it('preserva a largura total mesmo com muitos blocos no piso', () => {
    const curtos = Array.from({ length: 40 }, () => bloco(15));
    const { blocks } = layoutBlocks([...curtos, bloco(3000)], 600);
    expect(blocks.reduce((s, b) => s + b.width, 0)).toBeCloseTo(600, 6);
    expect(blocks.every((b) => b.width >= PISO_LARGURA_PX)).toBe(true);
  });

  // Silenciar a distorção seria pior que mostrá-la: o eixo passa a mentir sobre
  // o tempo, e o treinador não tem como saber.
  it('sinaliza compressão quando a correção de piso passa de 8% da largura', () => {
    const curtos = Array.from({ length: 40 }, () => bloco(5));
    expect(layoutBlocks([...curtos, bloco(3600)], 600).overflowCompressed).toBe(true);
  });

  it('não sinaliza compressão num treino de blocos folgados', () => {
    expect(layoutBlocks([bloco(600), bloco(1200), bloco(600)], 600).overflowCompressed).toBe(false);
  });

  it('lida com lista vazia sem quebrar', () => {
    expect(layoutBlocks([], 600)).toEqual({ blocks: [], overflowCompressed: false });
  });

  it('um bloco só ocupa a largura inteira', () => {
    expect(layoutBlocks([bloco(1800)], 600).blocks[0].width).toBe(600);
  });
});

describe('heightOf — altura', () => {
  // AC-2 em forma de fórmula. A medição em px roda no Playwright; aqui prova-se
  // que a conta é a certa, que é o que o jsdom consegue provar.
  it('projeta a intensidade normalizada sobre a altura do plot', () => {
    expect(heightOf(0.26, 176)).toBeCloseTo(45.76, 2);
    expect(heightOf(0.78, 176)).toBeCloseTo(137.28, 2);
  });

  it('mantém a razão entre duas alturas igual à razão entre as intensidades', () => {
    const razao = heightOf(0.78, 176) / heightOf(0.26, 176);
    expect(razao).toBeCloseTo(0.78 / 0.26, 6);
  });

  // Um bloco Z1 achatado numa linha deixa de ser um bloco e vira uma régua.
  it('dá piso de 12% para o bloco leve continuar sendo um bloco', () => {
    expect(heightOf(0.01, 176)).toBeCloseTo(176 * PISO_ALTURA, 6);
  });

  it('satura no teto — a barra nunca passa da altura do plot', () => {
    expect(heightOf(1.4, 176)).toBe(176);
  });
});
