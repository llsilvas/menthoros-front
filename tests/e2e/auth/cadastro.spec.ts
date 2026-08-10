import { test, expect } from '@playwright/test'
import { semSessaoNoProvedor } from '../../fixtures/pkceAuth'

/**
 * E2E do auto-cadastro público de assessoria.
 *
 * Obrigatório pelo `CLAUDE.md`: o fluxo cruza fronteira de sistema (contrato da API e Keycloak) e
 * desemboca em autenticação. O que só este nível cobre é o que os testes de componente não veem —
 * o `createHashRouter` de verdade, o `localStorage` de verdade e a requisição saindo pela rede.
 *
 * A API é interceptada, não real: criar assessoria de verdade deixaria organização e usuário no
 * realm a cada execução, e o teste passaria a depender de limpeza manual.
 */

const CADASTRO = '/#/cadastro'
const ROTA_DA_API = '**/api/public/coach-signups'

async function preencher(page: import('@playwright/test').Page) {
  await page.getByLabel(/seu nome/i).fill('Maria Treinadora')
  await page.getByLabel(/seu e-mail/i).fill('maria@exemplo.com')
  await page.getByLabel(/^senha/i).fill('senha-forte-o-suficiente')
  await page.getByLabel(/nome da assessoria/i).fill('Corrida na Serra')
}

test.describe('Auto-cadastro de assessoria', () => {
  test('cria a assessoria e instrui a verificar o e-mail, sem token no browser', async ({ page }) => {
    await semSessaoNoProvedor(page)

    let corpoEnviado: Record<string, unknown> = {}
    let chaveDeIdempotencia: string | undefined
    await page.route(ROTA_DA_API, async (route) => {
      corpoEnviado = route.request().postDataJSON() as Record<string, unknown>
      chaveDeIdempotencia = route.request().headers()['idempotency-key']
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          slug: 'corrida-na-serra',
          email: 'maria@exemplo.com',
          proximoPasso: 'Enviamos um e-mail de verificação. Confirme o endereço para poder entrar.',
        }),
      })
    })

    await page.goto(CADASTRO)
    await preencher(page)
    await page.getByRole('button', { name: /criar assessoria/i }).click()

    await expect(page.getByRole('heading', { name: /assessoria criada/i })).toBeVisible()
    await expect(page.getByText(/e-mail de verificação/i)).toBeVisible()

    // O header é o que impede o duplo clique de criar duas assessorias.
    expect(chaveDeIdempotencia).toBeTruthy()

    // A senha vai no corpo, mas não pode sobrar em lugar nenhum do browser.
    expect(corpoEnviado.senha).toBe('senha-forte-o-suficiente')
    const armazenado = await page.evaluate(() => JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }))
    expect(armazenado).not.toContain('senha-forte-o-suficiente')
    expect(armazenado).not.toContain('access_token')
  })

  test('o cadastro não envia o corpo quando o formulário está incompleto', async ({ page }) => {
    await semSessaoNoProvedor(page)

    let chamou = false
    await page.route(ROTA_DA_API, async (route) => {
      chamou = true
      await route.fulfill({ status: 201, body: '{}' })
    })

    await page.goto(CADASTRO)
    await page.getByLabel(/seu nome/i).fill('Maria')
    await page.getByLabel(/^senha/i).fill('curta')

    await expect(page.getByRole('button', { name: /criar assessoria/i })).toBeDisabled()
    expect(chamou).toBe(false)
  })

  test('conflito de identificador é comunicado sem jargão técnico', async ({ page }) => {
    await semSessaoNoProvedor(page)
    await page.route(ROTA_DA_API, (route) =>
      route.fulfill({ status: 409, contentType: 'application/json', body: '{}' }),
    )

    await page.goto(CADASTRO)
    await preencher(page)
    await page.getByRole('button', { name: /criar assessoria/i }).click()

    await expect(page.getByRole('alert')).toContainText(/já está em uso/i)
    // O formulário continua preenchido: perder os dados por um slug repetido seria punitivo.
    await expect(page.getByLabel(/seu e-mail/i)).toHaveValue('maria@exemplo.com')
  })

  test('os links legais abrem as páginas certas — e são links, não aceite', async ({ page }) => {
    await semSessaoNoProvedor(page)
    await page.goto(CADASTRO)

    // Nenhum checkbox: o consentimento versionado é coletado depois do login.
    await expect(page.getByRole('checkbox')).toHaveCount(0)

    await page.getByRole('link', { name: /termos de uso/i }).click()
    await expect(page).toHaveURL(/#\/termos/)
  })
})
