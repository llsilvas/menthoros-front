import { describe, expect, it } from 'vitest';
import { buildInboxSummaryLine } from './inboxSummaryKpis';

const BASE = { totalAtletas: 23, ativos: 19, emAtencao: 3, treinosPlanejadosSemana: 61, generatedAt: '2026-11-07T14:32:00Z' };

describe('buildInboxSummaryLine', () => {
  it('quatro segmentos na ordem: ativos de total, em atenção, treinos, atualizado', () => {
    expect(buildInboxSummaryLine(BASE).map((s) => [s.key, s.value, s.label])).toEqual([
      ['ativos', '19', 'ativos de 23'],
      ['atencao', '3', 'em atenção'],
      ['treinos', '61', 'treinos esta semana'],
      ['atualizado', new Date(BASE.generatedAt).toLocaleTimeString('pt-BR', { timeStyle: 'short' }), 'atualizado'],
    ]);
  });

  it('em atenção ganha tom de aviso só quando há alguém na fila', () => {
    expect(buildInboxSummaryLine(BASE)[1].tone).toBe('warning');
    expect(buildInboxSummaryLine({ ...BASE, emAtencao: 0 })[1].tone).toBe('neutral');
  });

  it('o horário carrega a data completa no title; sem generatedAt o segmento some', () => {
    const atualizado = buildInboxSummaryLine(BASE)[3];
    expect(atualizado.title).toBe(new Date(BASE.generatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
    expect(buildInboxSummaryLine({ ...BASE, generatedAt: null }).map((s) => s.key)).toEqual(['ativos', 'atencao', 'treinos']);
  });
});
