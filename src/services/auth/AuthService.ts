import axios from 'axios';
import type { LoginRequest, LoginResult, KeycloakTokenResponse } from '../../types/auth/LoginTypes';
import { runtimeConfig } from '../../config/env';

const INVALID_CREDENTIALS = 'Credenciais inválidas. Verifique usuário e senha.';
const GENERIC_LOGIN_ERROR = 'Não foi possível realizar login no momento. Tente novamente.';

export class AuthService {
  static async login({ username, password }: LoginRequest): Promise<LoginResult> {
    const tokenUrl = `${runtimeConfig.keycloakUrl}/realms/${runtimeConfig.keycloakRealm}/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: runtimeConfig.keycloakClientId,
      scope: 'openid profile email organization',
    });

    try {
      const response = await axios.post<KeycloakTokenResponse>(tokenUrl, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return { accessToken: response.data.access_token };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as { error?: string; error_description?: string } | undefined;
        const keycloakDetail = [data?.error, data?.error_description].filter(Boolean).join(': ');

        if (status === 401) {
          throw new Error(INVALID_CREDENTIALS);
        }

        if (keycloakDetail) {
          throw new Error(`Falha no login (${status ?? 'sem status'}): ${keycloakDetail}`);
        }
      }
      throw new Error(GENERIC_LOGIN_ERROR);
    }
  }
}
