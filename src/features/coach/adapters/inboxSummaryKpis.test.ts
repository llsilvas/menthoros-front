import { describe, expect, it } from 'vitest';
import { buildInboxSummaryKpiViews } from './inboxSummaryKpis';

const SUMMARY = { totalAtletas: 5, ativos: 1, emAtencao: 4, treinosPlanejadosSemana: 4, atletasExibidos: 5, itensFilaAtencao: 1 };

describe('buildInboxSummaryKpiViews', () => {
  it('quatro células na ordem, com a base de cada número na linha de apoio', () => {
    expect(buildInboxSummaryKpiViews(SUMMARY).map((v) => [v.key, v.label, v.value, v.detail])).toEqual([
      ['ativos', 'Atletas ativos', '1', '5 no total'],
      ['treinos', 'Treinos planejados', '4', 'Nesta semana, em todos os planos'],
      ['atencao', 'Em atenção', '4', '1 sinal na fila'],
      ['exibidos', 'Atletas exibidos', '5', 'Na lista, com os filtros atuais'],
    ]);
  });

  it('valores neutros: a cor fica no ícone da célula', () => {
    expect(buildInboxSummaryKpiViews(SUMMARY).every((v) => v.tone === 'neutral' && v.badge === null && v.qualifier === null)).toBe(true);
  });

  it('fila vazia e plural', () => {
    expect(buildInboxSummaryKpiViews({ ...SUMMARY, itensFilaAtencao: 0 })[2].detail).toBe('Nenhum sinal na fila');
    expect(buildInboxSummaryKpiViews({ ...SUMMARY, itensFilaAtencao: 3 })[2].detail).toBe('3 sinais na fila');
  });
});
