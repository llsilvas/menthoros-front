import type { AthleteWorkoutAnalysis } from '../../types/AthleteWorkoutAnalysis';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AthleteAnalysisService {

    /**
     * Análise pós-treino do atleta autenticado para um treino realizado dele.
     * `null` quando não há nada a mostrar (HTTP 204: treino não elegível, análise falhou,
     * bloco indisponível ou recurso desligado). `404` quando o realizado não é do atleta.
     */
    public static async getByRealizado(
        treinoRealizadoId: string,
    ): Promise<AthleteWorkoutAnalysis | null> {
        const resposta = await __request<AthleteWorkoutAnalysis>(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/me/realizados/{id}/analise',
            path: {
                'id': treinoRealizadoId,
            },
            errors: {
                404: 'Treino realizado não encontrado ou de outro atleta',
            },
        });
        return resposta ?? null;
    }
}
