import { OpenAPI } from '../api/core/OpenAPI';
import type { StravaStatusGlobal } from '../types/Metricas';

const getAuthToken = async (): Promise<string> => {
  if (!OpenAPI.TOKEN) {
    throw new Error('No authorization token available');
  }

  if (typeof OpenAPI.TOKEN === 'string') {
    return OpenAPI.TOKEN;
  }

  return await OpenAPI.TOKEN({} as any);
};

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
