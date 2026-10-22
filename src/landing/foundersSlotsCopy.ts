import type { FoundersSlots } from '../types/FoundersSlots';

export interface FoundersSlotsState {
  data: FoundersSlots | null;
  loading: boolean;
  error: boolean;
}

export interface FoundersSlotsLabels {
  /** Texto sem número — carregando ou falha do endpoint. */
  baseLabel: string;
  /** Texto exibido quando ainda há vagas, com `{remaining}`/`{total}` a substituir. */
  openLabel: string;
  /** Texto exibido quando as vagas se esgotaram. */
  closedLabel: string;
}

/**
 * Deriva o texto certo por estado — carregando/falha nunca mostram número (poderia estar errado),
 * vagas abertas mostram "Restam N de T", esgotadas mostram o texto de lista de espera. Função
 * pura, sem React, para ser testável isoladamente e reutilizada nos dois pontos de exibição
 * (badge da home, cabeçalho do formulário em /waitlist).
 */
export function foundersSlotsLabel(state: FoundersSlotsState, labels: FoundersSlotsLabels): string {
  const { data, loading, error } = state;

  if (loading || error || !data) {
    return labels.baseLabel;
  }

  if (!data.open) {
    return labels.closedLabel;
  }

  return labels.openLabel
    .replace('{remaining}', String(data.remaining))
    .replace('{total}', String(data.total));
}
