import { Buffer } from 'node:buffer'

export const TOKEN_KEY = '@Menthoros:token'

/**
 * Builds a syntactically valid JWT with a future expiry.
 * The signature is fake — it's never verified by the frontend,
 * which only reads the payload.
 *
 * **O token precisa carregar tenant e roles reais.** `isTokenValid` exige
 * `hasRequiredTenantClaims`, e o roteamento por papel espera `TECNICO`/`ATLETA`/`ADMIN`. Sem isso o
 * app trata a sessão como inválida e manda para o login — foi o que deixou **9 specs E2E
 * quebrados sem ninguém notar**, porque nada os executava automaticamente (ver `enable-frontend-ci`).
 *
 * O formato do `organization` espelha o que o Keycloak emite com o scope `organization`: um objeto
 * indexado pelo alias da organização, cada um com `tenant_id` em array.
 */
export function buildFakeJwt(overrides?: { exp?: number; sub?: string; roles?: string[] }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      sub: overrides?.sub ?? 'test-coach-uuid',
      name: 'Coach de Teste',
      email: 'coach@teste.com',
      preferred_username: 'coach.teste',
      exp: overrides?.exp ?? Math.floor(Date.now() / 1000) + 3600,
      iss: 'http://localhost:8080/realms/menthoros',
      realm_access: { roles: overrides?.roles ?? ['ADMIN'] },
      organization: {
        'assessoria-demo': {
          tenant_id: ['11111111-1111-1111-1111-111111111111'],
          name: 'Assessoria Demo',
        },
      },
    })
  ).toString('base64url')
  return `${header}.${payload}.fakesignature`
}
