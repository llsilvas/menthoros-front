import { runtimeConfig } from '../config/env';

export type LoginRequest = {
  username: string;
  password: string;
};

export type KeycloakTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: 'Bearer';
  scope: string;
};

export type LoginResult = {
  accessToken: string;
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Credenciais inválidas');
    this.name = 'InvalidCredentialsError';
  }
}

export async function login(request: LoginRequest): Promise<LoginResult> {
  const { keycloakUrl, keycloakRealm, keycloakClientId } = runtimeConfig;
  const url = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: 'password',
    username: request.username,
    password: request.password,
    client_id: keycloakClientId,
    scope: 'openid profile email organization',
  });

  console.debug('[authService] body:', body.toString());

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: string; error_description?: string } | null;
    console.error('[authService] Keycloak error', response.status, errorBody);

    if (response.status === 401 || errorBody?.error === 'invalid_grant') {
      throw new InvalidCredentialsError();
    }

    throw new Error('Erro ao autenticar. Tente novamente.');
  }

  const data: KeycloakTokenResponse = await response.json();
  return { accessToken: data.access_token };
}
