import { OpenAPI } from '../api/core/OpenAPI';
import { getAccessToken } from '../context/auth/session';
import type { AdesaoSemanal, ResumoSemanalTreino, AdesaoDiaria } from '../types/Metricas';

// Reexporta a fonte única em vez de reimplementar a leitura: este helper existia duplicado aqui e
// em StravaService, cada um remontando a lógica de `OpenAPI.TOKEN` (ver `context/auth/session`).
const getAuthToken = getAccessToken;

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

  static async getAdesaoDiaria(atletaId: string): Promise<AdesaoDiaria> {
    const response = await fetch(
      `${OpenAPI.BASE}/api/v1/atletas/${atletaId}/metricas/adesao-diaria`,
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch daily adherence metrics: ${response.statusText}`);
    }

    return response.json();
  }

  static async getAdesaoDiariaAssessoria(): Promise<AdesaoDiaria> {
    const response = await fetch(
      `${OpenAPI.BASE}/api/v1/metricas/adesao-diaria-assessoria`,
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch assessoria daily adherence metrics: ${response.statusText}`);
    }

    return response.json();
  }
}
