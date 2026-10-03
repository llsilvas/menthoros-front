import type { MetricTone } from '../../../types/FaixaTsb';

/**
 * Uma célula de KPI (faixa do atleta, métricas do Diagnóstico, resumo do Inbox, tela Atletas) —
 * tudo já formatado para exibir. Contrato de `KpiCell`/`KpiStrip`.
 */
export interface KpiView {
  /** Nome da métrica. Fica num span próprio para testes e leitores de tela acharem pelo nome. */
  label: string;
  /** Janela ou unidade ("4 sem", "7 dias", "TSB"). */
  qualifier: string | null;
  value: string;
  /** Base do valor ou motivo de não haver um. Pode quebrar em até 2 linhas. */
  detail: string;
  tone: MetricTone;
  /** Selo ao lado do valor — hoje só "Baixa confiança" no ACWR. */
  badge: string | null;
}
