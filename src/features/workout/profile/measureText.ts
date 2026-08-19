// Medição de texto para a cadeia de fallback do rótulo (§4.7 da spec).
//
// A spec pede **medir** o texto, não estimar por contagem de caracteres — e a
// diferença apareceu na tela: a estimativa de 6px por caractere escolhia o
// rótulo completo para um bloco de 100px, onde "DESAQUECIMENTO" mede 99px reais
// e enche o bloco de borda a borda. Num plot mais largo o mesmo cálculo passa do
// limite e o texto é decepado pelo `overflow: hidden`.

/** Fallback quando não há canvas — jsdom. Calibrado por medição real (ver abaixo). */
const PX_POR_CARACTERE = 7.5;

let contexto: CanvasRenderingContext2D | null | undefined;

function obterContexto(): CanvasRenderingContext2D | null {
  if (contexto !== undefined) return contexto;
  try {
    contexto = document.createElement('canvas').getContext('2d');
  } catch {
    contexto = null;
  }
  return contexto;
}

/**
 * Largura do texto em px, medida quando o ambiente permite.
 *
 * No navegador usa `measureText`, que é a medida de verdade. Em jsdom o canvas
 * não existe (ou devolve zero), então cai numa estimativa por caractere
 * **calibrada com medição real** — 7.5px cobre o pior caso observado a 0.625rem
 * (`AQUECIMENTO` = 7.27px/char, `DESAQUECIMENTO` = 7.07). O valor antigo, 6,
 * era otimista o bastante para escolher um rótulo que não cabia.
 *
 * A estimativa é deliberadamente **pessimista**: errar para o lado de mostrar a
 * abreviação é barato; errar para o lado de decepar o rótulo é o defeito que o
 * AC-7 existe para impedir.
 */
export function medirTexto(texto: string, fontCss: string): number {
  const ctx = obterContexto();
  if (ctx) {
    ctx.font = fontCss;
    const largura = ctx.measureText(texto).width;
    if (largura > 0) return largura;
  }
  return texto.length * PX_POR_CARACTERE;
}

/** Monta o `font` do canvas no formato que ele espera: `<weight> <size> <family>`. */
export function fontCss(weight: number | string, size: string, family: string): string {
  return `${weight} ${size} ${family}`;
}
