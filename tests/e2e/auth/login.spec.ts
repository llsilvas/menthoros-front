import { test, expect } from '@playwright/test'
import { aguardarFluxoEstavel, autenticarComPkce, semSessaoNoProvedor } from '../../fixtures/pkceAuth'
import { TOKEN_KEY } from '../../fixtures/auth'
import { REDIRECT_URI } from '../../fixtures/idp'

/**
 * E2E de autenticação — Authorization Code + PKCE.
 *
 * Reescrito na migração: a versão anterior exercitava o ROPC (preenchia usuário e senha, mockava o
 * token endpoint e conferia o token em `localStorage`). Esse fluxo deixou de existir — a senha é
 * digitada na tela do Keycloak e nunca passa pela aplicação.
 *
 * Autenticação encabeça a lista de fluxos críticos do `CLAUDE.md`, então este arquivo é a cobertura
 * obrigatória dela.
 */

const ROTA_PROTEGIDA = '/#/atletas'
const LOGIN = '/#/auth/login'

test.describe('Autenticação', () => {
  /**
   * `fix-login-direct-keycloak-redirect`: não existe mais tela intermediária com botão. Recusada a
   * restauração silenciosa, o app pede o login interativo sozinho — e leva junto a rota que o
   * usuário abriu, para devolvê-lo a ela.
   */
  test('rota protegida sem sessão vai direto ao provedor e volta na rota aberta', async ({ page }) => {
    await semSessaoNoProvedor(page)
    await page.goto(ROTA_PROTEGIDA)

    await page.waitForURL(/\/protocol\/openid-connect\/auth\?/)
    const pedido = new URL(page.url())
    // Interativo: com `prompt=none` o provedor recusaria de novo, sem mostrar a tela de senha.
    expect(pedido.searchParams.has('prompt')).toBe(false)
    expect(pedido.searchParams.get('response_type')).toBe('code')

    // O usuário "digita a senha": o provedor devolve o code com o mesmo state.
    await autenticarComPkce(page)
    const state = pedido.searchParams.get('state') ?? ''
    await page.goto(`${REDIRECT_URI}?code=codigo-de-teste&state=${encodeURIComponent(state)}`)

    await expect(page).toHaveURL(/#\/atletas/)
    expect(page.url()).not.toContain('error=')
  })

  /** O "Entrar" da landing aponta para a rota de login, que não espera um segundo clique. */
  test('a rota de login redireciona sozinha ao provedor, sem botão', async ({ page }) => {
    await semSessaoNoProvedor(page)
    await page.goto(LOGIN)

    await page.waitForURL(/\/protocol\/openid-connect\/auth\?/)
    expect(new URL(page.url()).searchParams.has('prompt')).toBe(false)
  })

  test('com sessão no provedor, a rota protegida abre sem passar pelo login', async ({ page }) => {
    await autenticarComPkce(page)

    await page.goto(ROTA_PROTEGIDA)

    await expect(page).not.toHaveURL(/#\/auth\/login/)
    await expect(page).toHaveURL(/#\/atletas/)
  })

  /**
   * Um `code` já usado é rejeitado pelo provedor. Se ele sobrar na barra de endereço, um reload
   * reenvia o mesmo código e o usuário vê um erro sem ter feito nada.
   */
  test('a URL não conserva code nem state depois do login', async ({ page }) => {
    await autenticarComPkce(page)

    await page.goto(ROTA_PROTEGIDA)
    await expect(page).toHaveURL(/#\/atletas/)

    expect(page.url()).not.toContain('code=')
    expect(page.url()).not.toContain('state=')
  })

  /**
   * Critério de aceite da change: o token não é persistido. Um XSS não deve encontrar credencial
   * legível, e a chave do mecanismo antigo não pode ressurgir.
   */
  test('nenhum token fica no localStorage', async ({ page }) => {
    await autenticarComPkce(page)
    await page.goto(ROTA_PROTEGIDA)
    await expect(page).toHaveURL(/#\/atletas/)
    await aguardarFluxoEstavel(page)

    const armazenado = await page.evaluate(
      (chave) => ({ legado: localStorage.getItem(chave), total: localStorage.length }),
      TOKEN_KEY,
    )

    expect(armazenado.legado).toBeNull()
    expect(armazenado.total).toBe(0)
  })

  /**
   * Decisão 0.5 da change: a virada derruba sessões do mecanismo antigo, em vez de deixá-las
   * expirar. Sem isso, sobra token velho no storage com o app já esperando sessão em memória.
   */
  test('token do mecanismo antigo é descartado no bootstrap', async ({ page }) => {
    await autenticarComPkce(page)
    await page.addInitScript(
      (chave) => localStorage.setItem(chave, 'token-antigo-qualquer'),
      TOKEN_KEY,
    )

    await page.goto(ROTA_PROTEGIDA)
    await expect(page).toHaveURL(/#\/atletas/)
    await aguardarFluxoEstavel(page)

    expect(await page.evaluate((c) => localStorage.getItem(c), TOKEN_KEY)).toBeNull()
  })

  /**
   * Recarregar não pode devolver o usuário ao login. Foi o bug que o walking skeleton encontrou:
   * sem token persistido, o `getUser()` volta vazio e o app concluía "anônimo" em vez de perguntar
   * ao provedor se a sessão continua de pé.
   */
  test('recarregar mantém a sessão', async ({ page }) => {
    await autenticarComPkce(page)
    await page.goto(ROTA_PROTEGIDA)
    await expect(page).toHaveURL(/#\/atletas/)

    // Recarregar antes de o bootstrap fechar testaria uma corrida do teste, não o comportamento do
    // app.
    await aguardarFluxoEstavel(page)

    await page.reload()

    await expect(page).toHaveURL(/#\/atletas/)
    await expect(page).not.toHaveURL(/#\/auth\/login/)
  })
})
