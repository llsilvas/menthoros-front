// Aritmética de cor sobre os tokens — contraste WCAG e matiz.
//
// Existe para que propriedades de paleta sejam *verificáveis* em vez de
// afirmadas em comentário: a rampa `workoutZone` promete ser monotônica em
// matiz e passar de 3:1 contra o fundo do plot, e as duas promessas viram
// asserção (AC-9). Sem isso, uma troca de hex que quebrasse a rampa passaria
// no code review sem que ninguém notasse.

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

export function relativeLuminance([r, g, b]: Rgb): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Razão de contraste WCAG 2.x entre duas cores opacas. 1:1 a 21:1. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Matiz em graus (0–360), com **vermelho em 0** — a convenção HSL padrão.
 *
 * É por isso que uma rampa fria→quente sai *decrescente*: ciano ≈199°, verde
 * ≈160°, amarelo ≈51°, laranja ≈25°, vermelho 0°. Cinza puro não tem matiz e
 * devolve 0, que colide com vermelho — por isso `hueOf` só serve para verificar
 * rampas cromáticas, e uma rampa que inclua um cinza precisa de outra checagem.
 */
export function hueOf(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255) as Rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}
