import { Buffer } from 'node:buffer'
import type { Page } from '@playwright/test'
import { buildFakeJwt } from './auth'

/**
 * Autenticação para E2E sob Authorization Code + PKCE.
 *
 * ## Por que não dá para injetar o token e seguir
 *
 * Até a migração, os specs autenticavam gravando um JWT em `localStorage`. Isso deixou de funcionar:
 * a sessão vive **em memória**, dentro do módulo de auth, e não há como escrevê-la de fora.
 *
 * A alternativa seria expor um atalho de teste na aplicação — o que faria os specs exercitarem o
 * atalho, não o mecanismo. Aqui o fluxo PKCE roda **inteiro e de verdade**; o que é falso é o
 * provedor de identidade, não o caminho do app.
 *
 * ## O que é interceptado
 *
 * 1. `.well-known/openid-configuration` — o discovery, para a lib achar os endpoints falsos.
 * 2. `/auth` — em vez da tela de login, devolve um redirect imediato para o `redirect_uri`, com o
 *    `code` e **o mesmo `state` que o app enviou**. Devolver outro `state` faria a lib rejeitar o
 *    retorno, que é justamente a proteção que ela deve ter.
 * 3. `/token` — troca o code por tokens.
 * 4. `/logout` — encerramento de sessão.
 */

const ISSUER = 'http://192.168.15.24:8080/realms/menthoros'

/** Endereço de retorno: o app usa a raiz, não uma rota de callback (ver design D4). */
const REDIRECT = 'http://localhost:5174/'

interface OpcoesAuth {
  /** Papéis no token. Default cobre o coach; use `['ATLETA']` para o outro shell. */
  roles?: string[]
}


/** `aud` precisa ser o client, e `iss` precisa bater com o discovery — a lib valida ambos. */
function construirIdToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const agora = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(
    JSON.stringify({
      iss: ISSUER,
      aud: 'menthoros-web',
      sub: 'test-coach-uuid',
      exp: agora + 3600,
      iat: agora,
      auth_time: agora,
      preferred_username: 'coach.teste',
      email: 'coach@teste.com',
    })
  ).toString('base64url')
  return `${header}.${payload}.assinatura-de-teste`
}

export async function autenticarComPkce(page: Page, { roles = ['ADMIN'] }: OpcoesAuth = {}) {
  const accessToken = buildFakeJwt({ roles })

  await page.route(`${ISSUER}/.well-known/openid-configuration`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/protocol/openid-connect/auth`,
        token_endpoint: `${ISSUER}/protocol/openid-connect/token`,
        end_session_endpoint: `${ISSUER}/protocol/openid-connect/logout`,
        jwks_uri: `${ISSUER}/protocol/openid-connect/certs`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        code_challenge_methods_supported: ['S256'],
      }),
    })
  })

  await page.route(`${ISSUER}/protocol/openid-connect/auth*`, async (route) => {
    const url = new URL(route.request().url())
    const state = url.searchParams.get('state') ?? ''

    // Redirect imediato de volta, como um Keycloak que já tem sessão faria. Assim o teste exercita
    // o retorno do fluxo — inclusive a restauração de destino e a limpeza da URL.
    await route.fulfill({
      status: 302,
      headers: { location: `${REDIRECT}?code=codigo-de-teste&state=${encodeURIComponent(state)}` },
      body: '',
    })
  })

  await page.route(`${ISSUER}/protocol/openid-connect/token`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: accessToken,
        // `id_token` é obrigatório aqui: o scope inclui `openid`, e a biblioteca decodifica o
        // id_token para montar o perfil. Sem ele — ou com um valor que não seja um JWT de três
        // partes — a falha é `Invalid token specified: missing part #2`, que não sugere a causa.
        id_token: construirIdToken(),
        token_type: 'Bearer',
        expires_in: 300,
        // Também precisa ser um JWT: a lib inspeciona o refresh token.
        refresh_token: construirIdToken(),
        scope: 'openid email profile organization',
      }),
    })
  })

  await page.route(`${ISSUER}/protocol/openid-connect/logout*`, async (route) => {
    await route.fulfill({ status: 302, headers: { location: REDIRECT }, body: '' })
  })
}

/**
 * Simula **ausência de sessão** no provedor.
 *
 * Sem isto, o app tentaria restaurar contra o Keycloak real — e o resultado do teste passaria a
 * depender de haver ou não sessão naquele servidor, que é estado externo e mutável. Com
 * `prompt=none` e sem sessão, o provedor responde `login_required`; é essa resposta que se imita.
 */
export async function semSessaoNoProvedor(page: Page) {
  await page.route(`${ISSUER}/.well-known/openid-configuration`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/protocol/openid-connect/auth`,
        token_endpoint: `${ISSUER}/protocol/openid-connect/token`,
        end_session_endpoint: `${ISSUER}/protocol/openid-connect/logout`,
        jwks_uri: `${ISSUER}/protocol/openid-connect/certs`,
        response_types_supported: ['code'],
        code_challenge_methods_supported: ['S256'],
      }),
    })
  })

  await page.route(`${ISSUER}/protocol/openid-connect/auth*`, async (route) => {
    const url = new URL(route.request().url())
    const state = url.searchParams.get('state') ?? ''
    await route.fulfill({
      status: 302,
      headers: { location: `${REDIRECT}?error=login_required&state=${encodeURIComponent(state)}` },
      body: '',
    })
  })
}
