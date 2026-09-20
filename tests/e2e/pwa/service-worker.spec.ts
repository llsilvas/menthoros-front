import { test, expect, type Page } from '@playwright/test'
import { MOCK_ATLETAS } from '../../fixtures/mocks'
import { autenticarComPkce, aguardarFluxoEstavel } from '../../fixtures/pkceAuth'
import { APP_ORIGIN, IDP_ORIGIN } from '../../fixtures/idp'

/**
 * Service worker do app-shell (add-athlete-pwa-installable, task 1.7).
 *
 * O `webServer` do Playwright roda `build && preview` — produção —, então o SW está ativo em TODOS
 * os specs desta suíte; eles viram regressão do login PKCE com SW de graça. Este arquivo cobre o
 * que só o SW promete: precache sem `/api`, `/auth` e `env-config.js` (R1/R5), a denylist de
 * navegação em `/auth/` (R3) e a casca offline (CA5a/CA5b).
 *
 * O IdP da fixture é **cross-origin** (`idp.ts`), logo o hop OIDC dos outros specs nunca passa
 * pelo SW — o R3 só é exercitado pela sonda same-origin daqui.
 */

const ATLETAS_URL = '/#/atletas'
const ATLETAS_API = '**/api/v1/atletas**'
const SONDA_AUTH_SAME_ORIGIN = '/auth/realms/menthoros/protocol/openid-connect/auth'

/**
 * Com `registerType: 'prompt'` (sem `clientsClaim`), o SW só controla a página a partir da
 * **segunda** navegação: registra no primeiro load, controla depois do reload.
 */
async function aguardarSwControlando(page: Page) {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
}

async function urlsEmCache(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const urls: string[] = []
    for (const nome of await caches.keys()) {
      const cache = await caches.open(nome)
      for (const requisicao of await cache.keys()) urls.push(requisicao.url)
    }
    return urls
  })
}

async function mockarAtletas(page: Page) {
  await page.route(ATLETAS_API, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ATLETAS) }),
  )
}

test.describe('PWA — service worker do app-shell', () => {
  test('controla a página, não cacheia /api, /auth nem env-config.js, e não intercepta /auth/ same-origin', async ({
    page,
  }) => {
    await aguardarSwControlando(page)
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)

    await autenticarComPkce(page)
    await mockarAtletas(page)
    await page.goto(ATLETAS_URL)
    await aguardarFluxoEstavel(page)
    await expect(page.getByText('Ana Corredora')).toBeVisible()

    const urls = await urlsEmCache(page)
    expect(urls.length).toBeGreaterThan(0) // o precache do shell existe
    expect(urls.filter((u) => /\/api\/|\/auth\/|env-config\.js/.test(u))).toEqual([])

    // Discriminante porque não há rota de runtime: com a denylist certa o SW não responde e o
    // browser vai à rede (`false`); com a denylist quebrada a rota de navegação serve o
    // `index.html` precacheado (`true`). Só a origem da resposta importa, não o corpo.
    const resposta = await page.goto(SONDA_AUTH_SAME_ORIGIN)
    expect(resposta).not.toBeNull()
    expect(resposta!.fromServiceWorker()).toBe(false)

    // Sai de uma rota da denylist antes que qualquer teste seguinte recarregue.
    await page.goto('/')
  })

  test('offline antes do reload: a casca abre e não há navegação de topo pro IdP (CA5a)', async ({
    page,
    context,
  }) => {
    await aguardarSwControlando(page)

    // Sem marca `menthoros:restauracao-tentada` (contexto novo): sem a guarda `!navigator.onLine`
    // do AuthProvider, isto terminaria em `signinRedirect` e na página de erro do Chromium.
    await context.setOffline(true)
    await page.reload()

    await expect(page.locator('#root')).not.toBeEmpty()
    expect(new URL(page.url()).origin).toBe(APP_ORIGIN)
    expect(page.url().startsWith(IDP_ORIGIN)).toBe(false)
  })

  test('offline sem reload: a sessão em memória sobrevive e nenhuma resposta de /api vem do SW (CA5b)', async ({
    page,
    context,
  }) => {
    await aguardarSwControlando(page)
    await autenticarComPkce(page)
    await mockarAtletas(page)
    await page.goto(ATLETAS_URL)
    await aguardarFluxoEstavel(page)
    await expect(page.getByText('Ana Corredora')).toBeVisible()

    await page.unroute(ATLETAS_API)
    const respostasDeApiViaSw: string[] = []
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.fromServiceWorker()) respostasDeApiViaSw.push(r.url())
    })
    await context.setOffline(true)

    // Navegação de hash, sem reload: o token em memória sobrevive e a nova busca falha na rede.
    await page.evaluate(() => {
      window.location.hash = '#/athlete/home'
    })
    await page.evaluate(() => {
      window.location.hash = '#/atletas'
    })
    await page.waitForTimeout(500)

    await expect(page).not.toHaveURL(/#\/auth\/login/)
    await expect(page.locator('#root')).not.toBeEmpty()
    expect(respostasDeApiViaSw).toEqual([])
  })
})
