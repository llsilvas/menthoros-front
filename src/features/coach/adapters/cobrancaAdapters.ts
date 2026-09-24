import type { AthleteBillingStatus } from '../../../types/Atleta';
import type { StatusBadgeVariant } from '../../../shared/components/StatusBadge';

export interface BillingBadge {
    variant: StatusBadgeVariant;
    label: string;
}

const LABELS: Readonly<Record<AthleteBillingStatus, string>> = {
    UP_TO_DATE: 'Em dia',
    DUE_SOON: 'Vence em breve',
    OVERDUE: 'Vencido',
};

const VARIANTS: Readonly<Record<AthleteBillingStatus, StatusBadgeVariant>> = {
    UP_TO_DATE: 'active',
    DUE_SOON: 'warning',
    OVERDUE: 'danger',
};

/**
 * Resolve o badge de cobrança do atleta (perfil e roster do coach).
 * Status ausente (sem contrato ou sem mensalidade em aberto) → null, sem badge.
 */
export function resolveStatusCobrancaBadge(status?: AthleteBillingStatus): BillingBadge | null {
    if (!status) return null;
    return { variant: VARIANTS[status], label: LABELS[status] };
}

/**
 * Formata `nextDueDate` (`yyyy-MM-dd`) para `dd/MM/yyyy` (pt-BR).
 * O ano é obrigatório aqui — diferente de outras datas exibidas no roster (ex. última
 * atividade), uma data de vencimento sem ano é ambígua. String vazia se ausente.
 */
export function formatProximoVencimento(iso?: string): string {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
}
