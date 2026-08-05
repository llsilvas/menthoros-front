import { test, expect } from '@playwright/test'
import { aguardarFluxoEstavel, autenticarComPkce, semSessaoNoProvedor } from '../../fixtures/pkceAuth'
import { TOKEN_KEY } from '../../fixtures/auth'

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
  test('a tela de entrada não pede senha', async ({ page }) => {
    // Sem sessão no provedor: a restauração é recusada com `login_required` e o app conclui anônimo.
    await semSessaoNoProvedor(page)
    await page.goto(LOGIN)

    // Recusada a restauração, o usuário tem de chegar ao login — e não à landing pública, que é o
    // que a raiz serve. A URL também não pode exibir o erro técnico de um fluxo invisível para ele.
    await expect(page).toHaveURL(/#\/auth\/login/)
    expect(page.url()).not.toContain('error=')

    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible()
    // O ponto central da migração: a aplicação não coleta mais credenciais.
    await expect(page.getByLabel(/senha/i)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
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
