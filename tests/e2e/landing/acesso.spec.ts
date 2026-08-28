import { test, expect } from '@playwright/test'

/**
 * E2E do formulário de acesso da landing (`AccessForm.tsx`).
 *
 * Obrigatório pelo `CLAUDE.md`: é o único ponto de captura de consentimento LGPD da landing, e
 * a change `landing-page-mvp-lancamento` trocou a garantia de "botão desabilitado até aceitar" por
 * "erro no submit" — só o browser real (não jsdom) prova que nenhum caminho de submit escapa dessa
 * validação, incluindo o link da Política de Privacidade, que já teve um bug real de clique
 * repassado ao checkbox (mesma classe de bug documentada em `CoachConsentDialog.tsx`).
 */

const LANDING = '/#/'
const ROTA_DA_API = '**/api/v1/waitlist'

async function preencherCampos(page: import('@playwright/test').Page) {
  await page.getByLabel('Nome').fill('Maria Treinadora')
  await page.getByLabel('Email').fill('maria@exemplo.com')
  await page.getByLabel('Número de atletas').fill('15')
}

test.describe('Formulário de acesso (programa fundador)', () => {
  test('não envia sem aceitar o consentimento — nem por clique nem por Enter — e mostra o erro', async ({ page }) => {
    let chamou = false
    await page.route(ROTA_DA_API, async (route) => {
      chamou = true
      await route.fulfill({ status: 201, body: '{}' })
    })

    await page.goto(LANDING)
    await preencherCampos(page)

    const submit = page.locator('button[type=submit]')
    await expect(submit).toBeEnabled()
    await submit.click()

    await expect(page.getByText('É preciso aceitar para continuar.')).toBeVisible()
    expect(chamou).toBe(false)

    await page.getByLabel('Nome').press('Enter')
    expect(chamou).toBe(false)
  })

  test('envia a inscrição completa quando o consentimento é aceito', async ({ page }) => {
    let corpoEnviado: Record<string, unknown> = {}
    await page.route(ROTA_DA_API, async (route) => {
      corpoEnviado = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
    })

    await page.goto(LANDING)
    await preencherCampos(page)
    await page.getByRole('checkbox').check()
    await page.locator('button[type=submit]').click()

    await expect(page.getByText(/inscrição recebida/i)).toBeVisible()
    expect(corpoEnviado.nome).toBe('Maria Treinadora')
    expect(corpoEnviado.email).toBe('maria@exemplo.com')
    expect(corpoEnviado.aceiteLgpd).toBe(true)
  })

  test('o link da Política de Privacidade navega — não alterna o checkbox', async ({ page }) => {
    let chamou = false
    await page.route(ROTA_DA_API, () => { chamou = true })

    await page.goto(LANDING)

    const checkbox = page.getByRole('checkbox')
    await expect(checkbox).not.toBeChecked()

    await page.getByRole('link', { name: /ler a política de privacidade/i }).click()

    await expect(page).toHaveURL(/#\/privacidade/)
    expect(chamou).toBe(false)
  })
})
