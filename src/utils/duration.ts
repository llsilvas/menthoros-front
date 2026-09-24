function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * "1796" -> "29:56"; "3619" -> "1:00:19" — sem zero à esquerda na hora/minuto quando ausente.
 * Compartilhado entre o painel do coach e o bloco de Progresso do atleta (achado de review,
 * 2026-09-18): mesma fórmula, evita divergir quando alguém corrigir um caso extremo num lado só.
 */
export function formatDuracaoEsforco(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  const mm = horas > 0 ? pad2(minutos) : String(minutos);
  return horas > 0 ? `${horas}:${mm}:${pad2(segs)}` : `${mm}:${pad2(segs)}`;
}
