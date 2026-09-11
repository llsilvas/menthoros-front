import { describe, expect, it } from 'vitest';
import { resolvePlannerReviewBadge, resolvePlannerReviewReasons } from './plannerReviewAdapters';

describe('resolvePlannerReviewBadge (planner-engine-enforcement §7.2)', () => {
    it('compliance FAILED → badge danger "Revisão obrigatória"', () => {
        expect(resolvePlannerReviewBadge({ plannerComplianceStatus: 'FAILED' })).toEqual({
            variant: 'danger',
            label: 'Revisão obrigatória',
        });
    });

    it('requiresCoachReview=true → badge (mesmo sem status FAILED)', () => {
        expect(resolvePlannerReviewBadge({ plannerRequiresCoachReview: true })).toEqual({
            variant: 'danger',
            label: 'Revisão obrigatória',
        });
    });

    it('PASSED → sem badge (null)', () => {
        expect(resolvePlannerReviewBadge({ plannerComplianceStatus: 'PASSED' })).toBeNull();
    });

    it('plano legado (sem campos de planner) → sem badge (null)', () => {
        expect(resolvePlannerReviewBadge({})).toBeNull();
    });
});

describe('resolvePlannerReviewReasons', () => {
    it('devolve os motivos, descartando nulos/vazios', () => {
        expect(
            resolvePlannerReviewReasons({
                plannerReviewReasons: ['dia indisponível', '', '   ', 'carga alta no taper'],
            }),
        ).toEqual(['dia indisponível', 'carga alta no taper']);
    });

    it('ausente/null → lista vazia', () => {
        expect(resolvePlannerReviewReasons({})).toEqual([]);
        expect(resolvePlannerReviewReasons({ plannerReviewReasons: null })).toEqual([]);
    });
});
