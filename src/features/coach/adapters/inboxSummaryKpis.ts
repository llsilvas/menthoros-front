import type { KpiView } from './athleteKpiAdapters';

/** Números do resumo do topo do Inbox (`dashboard.summary`, com os fallbacks da página). */
export interface InboxSummary {
  totalAtletas: number;
  ativos: number;
  emAtencao: number;
  treinosPlanejadosSemana: number;
  atletasExibidos: number;
  itensFilaAtencao: number;
}

export type InboxSummaryKpiKey = 'ativos' | 'treinos' | 'atencao' | 'exibidos';

export interface InboxSummaryKpiView extends KpiView {
  key: InboxSummaryKpiKey;
}

/**
 * Células do resumo do topo do Inbox, no formato da faixa de KPIs do atleta. São contagens: os
 * valores ficam neutros e o ícone de cada célula (na página) carrega a cor.
 */
export function buildInboxSummaryKpiViews(s: InboxSummary): InboxSummaryKpiView[] {
  const base = { qualifier: null, tone: 'neutral' as const, badge: null };
  return [
    { ...base, key: 'ativos', label: 'Atletas ativos', value: String(s.ativos), detail: `${s.totalAtletas} no total` },
    { ...base, key: 'treinos', label: 'Treinos planejados', value: String(s.treinosPlanejadosSemana), detail: 'Nesta semana, em todos os planos' },
    {
      ...base,
      key: 'atencao',
      label: 'Em atenção',
      value: String(s.emAtencao),
      detail: s.itensFilaAtencao > 0 ? `${s.itensFilaAtencao} ${s.itensFilaAtencao === 1 ? 'sinal' : 'sinais'} na fila` : 'Nenhum sinal na fila',
    },
    { ...base, key: 'exibidos', label: 'Atletas exibidos', value: String(s.atletasExibidos), detail: 'Na lista, com os filtros atuais' },
  ];
}
