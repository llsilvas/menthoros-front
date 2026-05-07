import { OpenAPI } from '../api/core/OpenAPI';
import type { AdesaoSemanal, ResumoSemanalTreino } from '../types/Metricas';

const getAuthToken = async (): Promise<string> => {
  if (!OpenAPI.TOKEN) {
    throw new Error('No authorization token available');
  }

  if (typeof OpenAPI.TOKEN === 'string') {
    return OpenAPI.TOKEN;
  }

  return await OpenAPI.TOKEN({} as any);
};

export class MetricasService {
  static async getAdesaoSemanal(atletaId: string): Promise<AdesaoSemanal> {
    const response = await fetch(
      `${OpenAPI.BASE}/api/v1/atletas/${atletaId}/metricas/adesao-semanal`,
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch adherence metrics: ${response.statusText}`);
    }

    return response.json();
  }

  static async getResumoSemanal(
    atletaId: string,
    semana?: string
  ): Promise<ResumoSemanalTreino> {
    const params = new URLSearchParams({ atletaId });
    if (semana) {
      params.append('semana', semana);
    }

    const response = await fetch(
      `${OpenAPI.BASE}/api/v1/treinos/realizados/resumo-semana?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch weekly summary: ${response.statusText}`);
    }

    return response.json();
  }
}
