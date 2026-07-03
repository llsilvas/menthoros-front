/**
 * Converte uma duração no formato "HH:MM:SS" (como o backend serializa `duracaoMin`
 * do treino planejado) em minutos arredondados. Retorna `null` para valores ausentes
 * ou malformados — fallback seguro para a UI não renderizar `NaN`.
 */
export function parseDuracaoMin(duracao: string | null | undefined): number | null {
  if (!duracao) return null;

  const partes = duracao.split(':');
  if (partes.length !== 3) return null;

  const [h, m, s] = partes.map((p) => Number(p));
  if ([h, m, s].some((n) => !Number.isFinite(n))) return null;

  const totalSegundos = h * 3600 + m * 60 + s;
  return Math.round(totalSegundos / 60);
}
