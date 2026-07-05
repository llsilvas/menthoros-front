import type { TreinoRealizadoDto } from '../../types/TreinoManual';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Serviço curado para importação de treinos a partir de arquivos .fit.
 * Endpoint: POST /api/v1/atletas/me/treinos/importar-fit (requer role ATLETA).
 */
export class FitUploadService {
    /**
     * Envia um arquivo .fit para importação como treino realizado.
     * @param arquivo arquivo .fit selecionado pelo atleta
     * @returns treino importado (o backend deduplica por externalId — reenvio do mesmo
     *          arquivo retorna o treino já existente em vez de duplicar)
     * @throws ApiError 403 (não ATLETA), 422 (arquivo inválido ou corrompido)
     */
    public static importar(arquivo: File): CancelablePromise<TreinoRealizadoDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/me/treinos/importar-fit',
            formData: { arquivo },
            errors: {
                403: 'Acesso negado',
                422: 'Arquivo .fit inválido ou corrompido',
            },
        });
    }
}
