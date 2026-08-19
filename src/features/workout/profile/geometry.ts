// Geometria do plot: duração → largura, intensidade → altura.
//
// Vive fora do componente porque é a única forma de provar a regra neste repo:
// o Vitest roda em jsdom com `css: false`, onde `getBoundingClientRect` devolve
// zero e um teste de altura passa tanto na implementação correta quanto na
// quebrada. Aqui a conta é testável sem DOM; o pixel é conferido no Playwright.

/** Abaixo disto o bloco some da tela, e uma etapa invisível é uma etapa não revisada. */
export const PISO_LARGURA_PX = 3;

/** Abaixo disto o bloco deixa de ser um bloco e vira uma linha. */
export const PISO_ALTURA = 0.12;

/** Acima desta fração da largura, a correção de piso distorce o eixo o bastante para ser declarada. */
const LIMITE_COMPRESSAO = 0.08;

export interface BlocoGeometria {
  durationSec: number;
  intensityNormalized: number;
}

export interface BlocoPosicionado {
  x: number;
  width: number;
}

export interface LayoutResultado {
  blocks: BlocoPosicionado[];
  /**
   * A soma dos pisos comeu mais de 8% da largura: o eixo X deixou de ser exato,
   * e o componente marca isso com `≈` junto ao último tick. Preferimos declarar
   * a distorção a escondê-la.
   */
  overflowCompressed: boolean;
}

export function layoutBlocks(blocos: BlocoGeometria[], plotWidth: number): LayoutResultado {
  if (blocos.length === 0) return { blocks: [], overflowCompressed: false };

  const total = blocos.reduce((s, b) => s + b.durationSec, 0);
  if (total <= 0 || plotWidth <= 0) {
    const iguais = plotWidth / blocos.length;
    return {
      blocks: blocos.map((_, i) => ({ x: i * iguais, width: iguais })),
      overflowCompressed: false,
    };
  }

  const ideais = blocos.map((b) => (b.durationSec / total) * plotWidth);

  // Quem está abaixo do piso sobe para ele; o excedente sai proporcionalmente de
  // quem está acima. Iterativo porque encolher pode empurrar um vizinho para
  // baixo do piso — resolver numa passada só deixaria blocos sub-piso.
  const fixos = new Array<boolean>(blocos.length).fill(false);
  const larguras = [...ideais];

  for (let passada = 0; passada < blocos.length; passada++) {
    const abaixo = larguras.map((w, i) => (!fixos[i] && w < PISO_LARGURA_PX ? i : -1)).filter((i) => i >= 0);
    if (abaixo.length === 0) break;

    for (const i of abaixo) {
      larguras[i] = PISO_LARGURA_PX;
      fixos[i] = true;
    }

    const usadoPorFixos = larguras.reduce((s, w, i) => (fixos[i] ? s + w : s), 0);
    const restante = plotWidth - usadoPorFixos;
    const somaFlexiveis = ideais.reduce((s, w, i) => (fixos[i] ? s : s + w), 0);

    if (somaFlexiveis <= 0) break;
    const fator = Math.max(0, restante) / somaFlexiveis;
    for (let i = 0; i < larguras.length; i++) {
      if (!fixos[i]) larguras[i] = ideais[i] * fator;
    }
  }

  const correcao = larguras.reduce((s, w, i) => s + Math.max(0, w - ideais[i]), 0);

  let x = 0;
  const blocks = larguras.map((width) => {
    const posicionado = { x, width };
    x += width;
    return posicionado;
  });

  return { blocks, overflowCompressed: correcao > LIMITE_COMPRESSAO * plotWidth };
}

/** Altura em px de um bloco, com piso e saturação no teto do plot. */
export function heightOf(intensityNormalized: number, plotHeight: number): number {
  const clamped = Math.min(1, Math.max(PISO_ALTURA, intensityNormalized));
  return plotHeight * clamped;
}
