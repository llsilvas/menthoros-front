import { OpenAPI } from '../api/core/OpenAPI';
import { getAccessToken } from '../context/auth/session';
import type { StravaStatusGlobal } from '../types/Metricas';

// Reexporta a fonte única em vez de reimplementar a leitura: este helper existia duplicado aqui e
// em StravaService, cada um remontando a lógica de `OpenAPI.TOKEN` (ver `context/auth/session`).
const getAuthToken = getAccessToken;

export class StravaService {
  static async getStatusGlobal(): Promise<StravaStatusGlobal> {
    const response = await fetch(
      `${OpenAPI.BASE}/api/v1/strava/status-global`,
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Strava status: ${response.statusText}`);
    }

    return response.json();
  }
}
