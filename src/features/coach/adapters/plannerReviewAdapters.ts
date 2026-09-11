import type { StatusBadgeVariant } from '../../../shared/components/StatusBadge';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';

export interface PlannerReviewBadge {
    variant: StatusBadgeVariant;
    label: string;
}

/**
 * Badge "Revisão obrigatória" quando o planner marcou o plano para revisão
 * (planner-engine-enforcement §7.2): `plannerComplianceStatus === 'FAILED'` ou
 * `plannerRequiresCoachReview === true`. Plano `PASSED`/legado (sem esses sinais) → `null`,
 * sem destaque. Função pura — sem hooks, sem estado.
 */
export function resolvePlannerReviewBadge(
    plano: Pick<PlanoSemanalDto, 'plannerComplianceStatus' | 'plannerRequiresCoachReview'>,
): PlannerReviewBadge | null {
    const exigeRevisao =
        plano.plannerRequiresCoachReview === true || plano.plannerComplianceStatus === 'FAILED';
    return exigeRevisao ? { variant: 'danger', label: 'Revisão obrigatória' } : null;
}

/**
 * Motivos de divergência do planner prontos para exibição — descarta nulos/vazios.
 * Lista vazia quando não há motivos (plano compliant/legado).
 */
export function resolvePlannerReviewReasons(
    plano: Pick<PlanoSemanalDto, 'plannerReviewReasons'>,
): string[] {
    return (plano.plannerReviewReasons ?? []).filter((motivo) => motivo != null && motivo.trim().length > 0);
}
