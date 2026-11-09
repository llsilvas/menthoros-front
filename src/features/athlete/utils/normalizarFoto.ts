import { surface } from '../../../theme/tokens';

/** Lado maior da foto depois de normalizada: 2160 px dá folga para o card Story em 1080×1920. */
export const FOTO_LADO_MAX = 2160;

/** Dimensões que cabem em `ladoMax` mantendo a proporção; nunca amplia. */
export function dimensoesReduzidas(largura: number, altura: number, ladoMax = FOTO_LADO_MAX) {
  const fator = Math.min(1, ladoMax / Math.max(largura, altura));
  return { largura: Math.round(largura * fator), altura: Math.round(altura * fator) };
}

/**
 * Prepara a foto escolhida para o card Stickers (athlete-share-cards-mapa, D5, CA7): aplica a
 * orientação EXIF (`imageOrientation: 'from-image'`), reduz o lado maior para no máximo
 * {@link FOTO_LADO_MAX} — uma foto de 12 MP rasterizada em pixelRatio 3 estoura a memória do iOS — e
 * devolve um data URL JPEG. Data URL não passa pelo fetch do `html-to-image`, então não há CORS nem
 * cache-busting quebrando a imagem. A foto nunca sai do aparelho.
 */
export async function normalizarFoto(arquivo: File): Promise<string> {
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
  try {
    const { largura, altura } = dimensoesReduzidas(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível');
    // JPEG não tem transparência: sem fundo, um PNG com alfa viraria preto.
    ctx.fillStyle = surface[0];
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    return canvas.toDataURL('image/jpeg', 0.88);
  } finally {
    bitmap.close();
  }
}
