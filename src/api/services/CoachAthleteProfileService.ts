import type { AtletaPerfilCoachDto } from '../../types/AtletaPerfilCoach';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Perfil consolidado de um atleta para o coach (`GET /api/v1/coach/atletas/{atletaId}/perfil`).
 * Restrito a TECNICO/ADMIN; tenant resolvido no backend via TenantContext.
 */
export class CoachAthleteProfileService {
    /**
     * Perfil completo de um atleta: PMC 90d, aderência 8 semanas, plano vigente,
     * sinais recentes, sugestões recentes e recordes pessoais.
     * Falhas parciais são registradas em `avisos`; os demais blocos continuam carregados.
     * @param atletaId UUID do atleta
     * @returns AtletaPerfilCoachDto perfil consolidado
     * @throws ApiError
     */
    public static getProfile(atletaId: string): CancelablePromise<AtletaPerfilCoachDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: `/api/v1/coach/atletas/${atletaId}/perfil`,
        });
    }
}
