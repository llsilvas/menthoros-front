import { Buffer } from 'node:buffer'

export const TOKEN_KEY = '@Menthoros:token'

/**
 * Builds a syntactically valid JWT with a future expiry.
 * The signature is fake — it's never verified by the frontend,
 * which only reads the payload.exp field to check if the token is expired.
 */
export function buildFakeJwt(overrides?: { exp?: number; sub?: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      sub: overrides?.sub ?? 'test-coach-uuid',
      name: 'Coach de Teste',
      email: 'coach@teste.com',
      preferred_username: 'coach.teste',
      exp: overrides?.exp ?? Math.floor(Date.now() / 1000) + 3600,
      iss: 'http://localhost:8080/realms/menthoros',
      realm_access: { roles: ['user'] },
    })
  ).toString('base64url')
  return `${header}.${payload}.fakesignature`
}

export const EXPIRED_JWT = buildFakeJwt({ exp: Math.floor(Date.now() / 1000) - 60 })
