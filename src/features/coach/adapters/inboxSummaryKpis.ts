/** Números do resumo em linha do topo do Inbox (`dashboard.summary`, com os fallbacks da página). */
export interface InboxSummary {
  totalAtletas: number;
  ativos: number;
  /** Tamanho da fila de atenção completa — não o `emAtencao` do resumo, que já divergiu dela. */
  emAtencao: number;
  treinosPlanejadosSemana: number;
  /** ISO do `dashboard.generatedAt`; `null` enquanto não há dashboard. */
  generatedAt: string | null;
}

export type InboxSummarySegmentKey = 'ativos' | 'atencao' | 'treinos' | 'atualizado';

export interface InboxSummarySegment {
  key: InboxSummarySegmentKey;
  /** O número (ou horário), em mono. */
  value: string;
  /** Texto antes do valor ("atualizado 14:32"). */
  prefix?: string;
  /** Texto depois do valor ("3 em atenção"). */
  suffix?: string;
  tone: 'neutral' | 'warning';
  /** Texto completo para o `title` quando o valor é abreviado (horário sem data). */
  title?: string;
}

/**
 * Resumo do topo do Inbox numa linha só: "19 ativos de 23 · 3 em atenção · 61 treinos esta semana
 * · atualizado 14:32". Substitui a faixa de quatro células de KPI (85px) que gastava a altura da
 * lista com contexto; só "em atenção" é triagem, e é o único segmento com tom.
 */
export function buildInboxSummaryLine(s: InboxSummary): InboxSummarySegment[] {
  const segmentos: InboxSummarySegment[] = [
    { key: 'ativos', value: String(s.ativos), suffix: `ativos de ${s.totalAtletas}`, tone: 'neutral' },
    { key: 'atencao', value: String(s.emAtencao), suffix: 'em atenção', tone: s.emAtencao > 0 ? 'warning' : 'neutral' },
    { key: 'treinos', value: String(s.treinosPlanejadosSemana), suffix: 'treinos esta semana', tone: 'neutral' },
  ];
  const data = s.generatedAt ? new Date(s.generatedAt) : null;
  // Data inválida sairia como "Invalid Date" na barra: melhor sem o segmento.
  if (data && !Number.isNaN(data.getTime())) {
    segmentos.push({
      key: 'atualizado',
      value: data.toLocaleTimeString('pt-BR', { timeStyle: 'short' }),
      prefix: 'atualizado',
      tone: 'neutral',
      title: data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    });
  }
  return segmentos;
}
