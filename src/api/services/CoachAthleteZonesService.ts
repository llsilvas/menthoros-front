import type {
    AthleteTrainingZonesDto,
    AthleteZoneAnchorsInput,
    AthleteZonesManualInput,
} from '../../types/AthleteTrainingZones';
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

    /**
     * Grava as âncoras (limiares) e devolve as zonas recalculadas.
     * @throws ApiError 400 com o campo inválido; 404 atleta fora do tenant
     */
    public static salvarAncoras(
        atletaId: string,
        body: AthleteZoneAnchorsInput,
    ): CancelablePromise<AthleteTrainingZonesDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: `/api/v1/coach/atletas/${atletaId}/zonas/ancoras`,
            body,
            mediaType: 'application/json',
        });
    }

    /**
     * Grava o modo das zonas por eixo e, em MANUAL, as faixas; LIMIAR apaga as faixas do eixo.
     * @throws ApiError 400 com o caminho da faixa (`fc.faixas[2].min`); 404 atleta fora do tenant
     */
    public static salvarZonasManuais(
        atletaId: string,
        body: AthleteZonesManualInput,
    ): CancelablePromise<AthleteTrainingZonesDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: `/api/v1/coach/atletas/${atletaId}/zonas/manuais`,
            body,
            mediaType: 'application/json',
        });
    }

    /** Zonas que as âncoras gerariam, sem gravar. Mesmo corpo e mesmas regras do PUT. */
    public static simular(
        atletaId: string,
        body: AthleteZoneAnchorsInput,
    ): CancelablePromise<AthleteTrainingZonesDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: `/api/v1/coach/atletas/${atletaId}/zonas/simulacao`,
            body,
            mediaType: 'application/json',
        });
    }
}
