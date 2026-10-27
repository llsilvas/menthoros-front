import type { AthleteTrainingZonesDto } from '../../types/AthleteTrainingZones';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Zonas de pace e FC de um atleta para o treinador (`GET /api/v1/coach/atletas/{atletaId}/zonas`).
 * Restrito a TECNICO/ADMIN; atleta de outro tenant responde 404.
 */
export class CoachAthleteZonesService {
    /**
     * @param atletaId UUID do atleta
     * @returns AthleteTrainingZonesDto seis zonas, âncoras e ajuste por fadiga
     * @throws ApiError
     */
    public static getZonas(atletaId: string): CancelablePromise<AthleteTrainingZonesDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: `/api/v1/coach/atletas/${atletaId}/zonas`,
        });
    }
}
