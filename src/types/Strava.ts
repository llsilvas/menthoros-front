export interface SyncStatus {
  connected: boolean;
  syncing: boolean;
  imported: number;
  lastError?: string;
  lastSync?: string;
  externalAthleteId?: string;
}

export interface SyncResponse {
  success: boolean;
  imported: number;
  message: string;
}

export interface StravaAuthorizationUrlResponse {
  authorizationUrl: string;
}
