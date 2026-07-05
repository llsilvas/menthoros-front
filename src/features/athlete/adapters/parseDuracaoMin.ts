/**
 * Converte uma duração no formato "HH:MM:SS" ou "MM:SS" (o backend serializa `duracaoMin`
 * em qualquer um dos dois — treino manual sem hora costuma vir "MM:SS", ex.: "45:00") em
 * minutos arredondados. Retorna `null` para valores ausentes ou malformados — fallback
 * seguro para a UI não renderizar `NaN`.
 */
export function parseDuracaoMin(duracao: string | null | undefined): number | null {
  if (!duracao) return null;

  const partes = duracao.split(':').map((p) => Number(p));
  if (partes.length !== 2 && partes.length !== 3) return null;
  if (partes.some((n) => !Number.isFinite(n))) return null;

  const [h, m, s] = partes.length === 3 ? partes : [0, partes[0], partes[1]];
  const totalSegundos = h * 3600 + m * 60 + s;
  return Math.round(totalSegundos / 60);
}
