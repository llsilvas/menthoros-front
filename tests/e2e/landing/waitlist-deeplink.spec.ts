import { test, expect } from '@playwright/test'

/**
 * E2E do deep link de bio para a waitlist (`redirectPathDeepLink` + captura de UTM).
 *
 * Obrigatório: cruza a fronteira roteamento↔captação (link de marketing → inscrição). Só o browser
 * real prova a cadeia inteira: um PATH limpo `/waitlist?utm=…` (o formato imune ao wrapper do
 * Instagram e ao 301 do apex, ver `deepLinkRedirect.ts`) precisa virar a rota de hash `#/waitlist`
 * mantendo a UTM no `search`, e a UTM tem de chegar ao corpo do POST. jsdom não roda o
 * `location.replace` de bootstrap nem o hash router de verdade.
 */

const ROTA_DA_API = '**/api/v1/waitlist'

test.describe('Deep link de bio → waitlist', () => {
  test('PATH /waitlist?utm=… cai na waitlist e leva a UTM ao POST', async ({ page }) => {
    let corpo: Record<string, unknown> = {}
    await page.route(ROTA_DA_API, async (route) => {
      corpo = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ status: 'CRIADO', mensagem: 'ok' }) })
    })

    // Formato de bio limpo (sem #, imune ao Instagram). O bootstrap traduz para a rota de hash.
    await page.goto('/waitlist?utm_source=instagram&utm_medium=social&utm_campaign=turma-fundadora')

    // Chegou na waitlist (não na landing), e o path virou fragmento com a query preservada.
    await expect(page.getByRole('heading', { name: /turma fundadora/i })).toBeVisible()
    await expect(page).toHaveURL(/#\/waitlist/)
    await expect(page).toHaveURL(/utm_source=instagram/)

    await page.getByRole('textbox', { name: 'Nome' }).fill('Maria Treinadora')
    await page.getByRole('textbox', { name: 'E-mail' }).fill('maria@exemplo.com')
    await page.getByRole('combobox', { name: 'Você é' }).click()
    await page.getByRole('option', { name: /^treinador/i }).click()
    await page.getByRole('checkbox').click()
    await page.getByRole('button', { name: /reservar minha vaga/i }).click()

    await expect(page.getByText(/você está na fila/i)).toBeVisible()
    expect(corpo.utmSource).toBe('instagram')
    expect(corpo.utmMedium).toBe('social')
    expect(corpo.utmCampaign).toBe('turma-fundadora')
  })

  test('o link da Política navega (não vira toggle do checkbox)', async ({ page }) => {
    await page.goto('/#/waitlist')

    const link = page.getByRole('link', { name: /ler a política de privacidade/i })
    await link.click()

    await expect(page).toHaveURL(/#\/privacidade/)
    // não navegou por acidente marcando o aceite: chegamos à página da política
    await expect(page.getByRole('heading', { name: /privacidade/i }).first()).toBeVisible()
  })
})
