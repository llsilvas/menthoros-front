import type { CoachAtletaResumo, CoachAttentionItem, CoachCalendario, CoachInsights } from '../../types/Coach';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Dashboards agregados do coach (`/api/v1/coach/**`). Restrito a TECNICO/ADMIN;
 * o tenant é resolvido no backend via `TenantContext`.
 */
export class CoachDashboardService {
    /**
     * Roster do coach: atletas do tenant com CTL/ATL/TSB, fase, status, última atividade e volume.
     * @returns CoachAtletaResumo lista do roster
     * @throws ApiError
     */
    public static getRoster(): CancelablePromise<Array<CoachAtletaResumo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/coach/atletas',
        });
    }

    /**
     * Calendário semanal: treinos planejados de todos os atletas do tenant na semana de `from`.
     * @param from dia dentro da semana desejada (ISO `yyyy-MM-dd`); default semana atual
     * @returns CoachCalendario calendário da semana
     * @throws ApiError
     */
    public static getCalendario(from?: string): CancelablePromise<CoachCalendario> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/coach/calendario-semanal',
            query: {
                'from': from,
            },
        });
    }

    /**
     * Insights agregados: KPIs, tendência de carga semanal e top atletas no intervalo.
     * @param from início do intervalo (ISO `yyyy-MM-dd`); default 12 semanas atrás
     * @param to fim do intervalo (ISO `yyyy-MM-dd`); default hoje
     * @returns CoachInsights insights do período
     * @throws ApiError
     */
    public static getInsights(from?: string, to?: string): CancelablePromise<CoachInsights> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/coach/insights',
            query: {
                'from': from,
                'to': to,
            },
        });
    }

    /**
     * Fila de atenção do coach: atletas do tenant que exigem ação imediata,
     * ordenados por severidade e priorityScore.
     * @returns CoachAttentionItem[] fila ordenada (severidade CRITICA antes de ALTA)
     * @throws ApiError
     */
    public static getAttentionQueue(): CancelablePromise<Array<CoachAttentionItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/coach/attention-queue',
        });
    }
}
