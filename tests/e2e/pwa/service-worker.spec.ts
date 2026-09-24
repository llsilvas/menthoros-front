import { test, expect, type Page } from '@playwright/test'
import { MOCK_ATLETAS } from '../../fixtures/mocks'
import { autenticarComPkce, aguardarFluxoEstavel, semSessaoNoProvedor } from '../../fixtures/pkceAuth'
import { APP_ORIGIN, IDP_ORIGIN } from '../../fixtures/idp'

/**
 * Service worker do app-shell (add-athlete-pwa-installable, task 1.7).
 *
 * O `webServer` do Playwright roda `build && preview` — produção —, então o SW é **registrado**
 * em todos os specs desta suíte. Ele só passa a **controlar** a página a partir da segunda
 * navegação same-origin (`registerType: 'prompt'`, sem `clientsClaim`).
 *
 * **O IdP tem de estar mockado ANTES do primeiro `goto`** (mesmo padrão dos outros specs): o
 * `AuthProvider` tenta restaurar a sessão em qualquer load e grava `menthoros:restauracao-tentada`
 * antes do redirect. Um primeiro load sem mock deixa a marca em `"1"` e nenhum login posterior
 * completa — `aguardarFluxoEstavel` expira (achado do QA cross-model, reproduzido 2/3).
 *
 * Os casos que exigem SW controlando (cache, denylist, casca offline) rodam anônimos com
 * `semSessaoNoProvedor`; o caso que exige sessão (offline sem reload) roda como os demais specs.
 *
 * O IdP da fixture é **cross-origin** (`idp.ts`), então o R3 (`/auth/` proxyado no mesmo origin
 * em produção) só é exercitado pela sonda same-origin daqui.
 */

const MARCA_RESTAURACAO = 'menthoros:restauracao-tentada'

const ATLETAS_URL = '/#/atletas'
const ATLETAS_API = '**/api/v1/atletas**'
const SONDA_AUTH_SAME_ORIGIN = '/auth/realms/menthoros/protocol/openid-connect/auth'

/**
 * Registra no primeiro load e passa a controlar depois do reload.
 *
 * O primeiro load dispara a restauração de sessão: com `semSessaoNoProvedor`, é um redirect de
 * ida e volta (`login_required`) que termina em `#/` sem query. Qualquer `evaluate` antes disso
 * morre com "Execution context was destroyed" — por isso a espera pela URL assentada.
 */
async function aguardarSwControlando(page: Page) {
  await page.goto('/')
  await page.waitForURL((url) => url.hash === '#/' && url.search === '')
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
  test('controla a página, só precacheia o shell (nunca /api, /auth, env-config.js) e não intercepta /auth/ same-origin', async ({
    page,
  }) => {
    await semSessaoNoProvedor(page) // antes do primeiro goto (ver cabeçalho)
    await aguardarSwControlando(page)
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)

    // Navega pelo shell público sob controle do SW; sem rota de runtime, nada além do precache
    // pode entrar no Cache Storage — inclusive se algum request a /api ou /auth acontecesse.
    await page.goto('/#/auth/login')
    await page.waitForFunction(() => window.location.hash === '#/auth/login')

    const urls = await urlsEmCache(page)
    expect(urls.length).toBeGreaterThan(0) // o precache do shell existe
    // Entries do precache carregam `?__WB_REVISION__=…`, por isso o `(\?|$)`.
    expect(urls.some((u) => /\/index\.html(\?|$)/.test(u))).toBe(true) // a casca está nele
    expect(urls.filter((u) => /\/api\/|\/auth\/|env-config\.js/.test(u))).toEqual([])

    // Discriminante porque não há rota de runtime: com a denylist certa o SW não responde e o
    // browser vai à rede (`false`); com a denylist quebrada a rota de navegação serve o
    // `index.html` precacheado (`true`). Só a origem da resposta importa, não o corpo.
    const resposta = await page.goto(SONDA_AUTH_SAME_ORIGIN)
    expect(resposta).not.toBeNull()
    expect(resposta!.fromServiceWorker()).toBe(false)
  })

  test('offline antes do reload: a casca abre e não há navegação de topo pro IdP (CA5a)', async ({
    page,
    context,
  }) => {
    await semSessaoNoProvedor(page) // antes do primeiro goto (ver cabeçalho)
    await aguardarSwControlando(page)

    // A restauração do primeiro load deixou a marca em "1", que por si só já pularia a próxima
    // tentativa e faria o teste passar sem exercer a guarda. Limpa pra que, no reload offline,
    // seja só a guarda `!navigator.onLine` do AuthProvider a impedir o `signinRedirect` — sem
    // ela, isto terminaria numa navegação de topo pro IdP e na página de erro do Chromium.
    await page.evaluate((chave) => sessionStorage.removeItem(chave), MARCA_RESTAURACAO)
    await context.setOffline(true)
    await page.reload()

    await expect(page.locator('#root')).not.toBeEmpty()
    expect(new URL(page.url()).origin).toBe(APP_ORIGIN)
    expect(page.url().startsWith(IDP_ORIGIN)).toBe(false)
  })

  test('offline sem reload: a sessão em memória sobrevive e a nova busca vai à rede (CA5b)', async ({
    page,
    context,
  }) => {
    // Sem `aguardarSwControlando`: com o SW controlando, o `page.route` do IdP não intercepta a
    // troca de code (ver cabeçalho). A garantia "nada de /api vem do SW" é do teste 1 + config.
    await autenticarComPkce(page)
    await mockarAtletas(page)
    await page.goto(ATLETAS_URL)
    await aguardarFluxoEstavel(page)
    await expect(page.getByText('Ana Corredora')).toBeVisible()

    await page.unroute(ATLETAS_API)
    await context.setOffline(true)

    // Navegação de hash, sem reload: o token em memória sobrevive e a nova busca vai à rede — e
    // falha, porque está offline. O `requestfailed` é a prova observável; substitui espera fixa.
    const buscaFalhouNaRede = page.waitForEvent('requestfailed', {
      predicate: (r) => r.url().includes('/api/'),
    })
    await page.evaluate(() => {
      window.location.hash = '#/athlete/home'
    })
    await page.evaluate(() => {
      window.location.hash = '#/atletas'
    })
    await page.waitForFunction(() => window.location.hash === '#/atletas')
    await buscaFalhouNaRede

    await expect(page).not.toHaveURL(/#\/auth\/login/)
    await expect(page.locator('#root')).not.toBeEmpty()
  })
})
