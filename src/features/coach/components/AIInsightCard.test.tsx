import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIInsightCard } from './AIInsightCard';
import type { CoachAttentionItem } from '../../../types/Coach';

function item(over: Partial<CoachAttentionItem> = {}): CoachAttentionItem {
  return {
    atletaId: 'a1',
    athleteName: 'Ana Silva',
    severity: 'ALTA',
    priorityScore: 90,
    primaryReason: 'ADERENCIA',
    suggestedAction: 'Reduzir o volume do próximo longão.',
    generatedAt: '2026-08-15T12:00:00Z',
    evidence: [{ label: 'Aderência 4s', value: '62%' }, { label: 'Treinos perdidos', value: '3' }],
    explanation: {
      rationale: 'Três treinos perdidos seguidos após aumento de carga.',
      sourceRules: ['adherence_drop', 'load_spike'],
      confidence: 'HIGH',
    },
    ...over,
  };
}

describe('AIInsightCard', () => {
  /**
   * As quatro seções existem para o coach poder **julgar** a recomendação: separar a evidência do
   * raciocínio é o que permite discordar. Antes, tudo isso chegava amassado num parágrafo de texto
   * livre (`notes`), embora o DTO já trouxesse os campos separados.
   */
  it('renderiza as quatro seções', () => {
    render(<AIInsightCard item={item()} recencyDays={14} />);

    expect(screen.getByText(/ocorrência/i)).toBeInTheDocument();
    expect(screen.getByText(/por que importa/i)).toBeInTheDocument();
    expect(screen.getByText(/evidência/i)).toBeInTheDocument();
    expect(screen.getByText(/ação sugerida/i)).toBeInTheDocument();
  });

  it('mostra motivo e recência na ocorrência', () => {
    render(<AIInsightCard item={item()} recencyDays={14} />);

    expect(screen.getByText(/aderência · 14d/i)).toBeInTheDocument();
  });

  it('mostra a evidência como pares rótulo/valor, não como frase', () => {
    render(<AIInsightCard item={item()} recencyDays={null} />);

    expect(screen.getByText('Aderência 4s')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByText('Treinos perdidos')).toBeInTheDocument();
  });

  /** Sem as regras que dispararam, discordar do insight vira palpite contra caixa-preta. */
  it('expõe as regras de origem', () => {
    render(<AIInsightCard item={item()} recencyDays={null} />);

    expect(screen.getByText(/adherence_drop/)).toBeInTheDocument();
  });

  it('omite seções sem dado, em vez de renderizar vazio', () => {
    render(<AIInsightCard item={item({ explanation: undefined, evidence: [] })} recencyDays={null} />);

    expect(screen.queryByText(/por que importa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/evidência/i)).not.toBeInTheDocument();
    // A ação sugerida é obrigatória no DTO: sempre aparece.
    expect(screen.getByText(/ação sugerida/i)).toBeInTheDocument();
  });

  it('sem recência, não inventa prazo', () => {
    render(<AIInsightCard item={item()} recencyDays={null} />);

    expect(screen.getByText(/^Aderência$/)).toBeInTheDocument();
  });
});
