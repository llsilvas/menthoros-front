import type { StatusVencimentoPlano } from '../../../types/Atleta';
import type { StatusBadgeVariant } from '../../../shared/components/StatusBadge';

export interface BillingBadge {
    variant: StatusBadgeVariant;
    label: string;
}

const LABELS: Readonly<Record<StatusVencimentoPlano, string>> = {
    EM_DIA: 'Em dia',
    PROXIMO_VENCIMENTO: 'Vence em breve',
    VENCIDO: 'Vencido',
};

const VARIANTS: Readonly<Record<StatusVencimentoPlano, StatusBadgeVariant>> = {
    EM_DIA: 'active',
    PROXIMO_VENCIMENTO: 'warning',
    VENCIDO: 'danger',
};

/**
 * Resolve o badge de vencimento do plano do atleta (perfil e roster do coach).
 * Status ausente (atleta sem dados de cobrança cadastrados) → null, sem badge.
 */
export function resolveStatusVencimentoPlanoBadge(status?: StatusVencimentoPlano): BillingBadge | null {
    if (!status) return null;
    return { variant: VARIANTS[status], label: LABELS[status] };
}

/**
 * Formata `dataVencimentoPlano` (`yyyy-MM-dd`) para `dd/MM/yyyy` (pt-BR).
 * O ano é obrigatório aqui — diferente de outras datas exibidas no roster (ex. última
 * atividade), uma data de vencimento sem ano é ambígua. String vazia se ausente.
 */
export function formatDataVencimentoPlano(iso?: string): string {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
}
