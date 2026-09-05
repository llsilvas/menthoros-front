import { test, expect } from '@playwright/test'
import { semSessaoNoProvedor } from '../../fixtures/pkceAuth'

/**
 * E2E do aceite do convite de atleta (change add-athlete-invite-token-link).
 *
 * Obrigatório pelo `CLAUDE.md`: auth/onboarding é fluxo crítico e este cruza a fronteira
 * front↔API↔Keycloak. O que só este nível cobre: o token viajando no fragmento do
 * `createHashRouter` real (e sumindo da URL), o fallback coach→atleta com requisições reais, e a
 * garantia de que nada sensível sobra em storage.
 *
 * A API é interceptada, não real: o aceite provisiona conta no Keycloak, e criar uma por execução
 * dependeria de limpeza manual.
 */

const TOKEN = 'tok-atleta-e2e'
const CADASTRO_COM_CONVITE = `/#/cadastro?convite=${TOKEN}`
const LOOKUP_COACH = '**/api/public/founding-invites/*'
const LOOKUP_ATLETA = '**/api/public/athlete-invites/*'
const ACEITE = '**/api/public/athlete-invites/aceitar'

async function armarConviteDeAtleta(page: import('@playwright/test').Page) {
  // O token é opaco: a página tenta o lookup de coach primeiro e recebe 404.
  await page.route(LOOKUP_COACH, (route) => route.fulfill({ status: 404, body: '{}' }))
  await page.route(LOOKUP_ATLETA, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        nomeAtleta: 'Ana Corredora',
        assessoria: 'Corrida na Serra',
        emailSugerido: 'ana@exemplo.com',
      }),
    }),
  )
}

test.describe('Aceite do convite de atleta', () => {
  test('aceita com e-mail trocado: vincula pelo token, avisa da verificação e não deixa rastro', async ({ page }) => {
    await semSessaoNoProvedor(page)
    await armarConviteDeAtleta(page)

    let corpoEnviado: Record<string, unknown> = {}
    await page.route(ACEITE, async (route) => {
      corpoEnviado = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({ status: 201, body: '' })
    })

    await page.goto(CADASTRO_COM_CONVITE)

    await expect(page.getByRole('heading', { name: /seu treinador te convidou/i })).toBeVisible()
    // O token sai da URL logo após o mount — não pode ficar no histórico.
    await expect(page).not.toHaveURL(new RegExp(TOKEN))

    // E-mail EDITÁVEL — diferença deliberada do fluxo de coach: o vínculo é pelo token.
    const email = page.getByLabel(/seu e-mail/i)
    await expect(email).toHaveValue('ana@exemplo.com')
    await email.fill('outro@exemplo.com')
    await page.getByLabel(/^senha/i).fill('senha-forte-o-suficiente')
    await page.getByRole('button', { name: /criar minha conta/i }).click()

    await expect(page.getByRole('heading', { name: /conta criada/i })).toBeVisible()
    await expect(page.getByText(/e-mail de verificação/i)).toBeVisible()

    expect(corpoEnviado.token).toBe(TOKEN)
    expect(corpoEnviado.email).toBe('outro@exemplo.com')

    // Nem token, nem senha, nem access_token podem sobrar no browser.
    const armazenado = await page.evaluate(() => JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }))
    expect(armazenado).not.toContain(TOKEN)
    expect(armazenado).not.toContain('senha-forte-o-suficiente')
    expect(armazenado).not.toContain('access_token')
  })

  test('convite consumido (410) orienta a fazer login em vez de um erro genérico', async ({ page }) => {
    await semSessaoNoProvedor(page)
    await armarConviteDeAtleta(page)
    await page.route(ACEITE, (route) => route.fulfill({ status: 410, body: '{}' }))

    await page.goto(CADASTRO_COM_CONVITE)
    await expect(page.getByRole('heading', { name: /seu treinador te convidou/i })).toBeVisible()

    await page.getByLabel(/^senha/i).fill('senha-forte-o-suficiente')
    await page.getByRole('button', { name: /criar minha conta/i }).click()

    await expect(page.getByRole('alert')).toContainText(/faça login/i)
  })

  test('token inválido nos dois lookups cai na tela de convite inválido', async ({ page }) => {
    await semSessaoNoProvedor(page)
    await page.route(LOOKUP_COACH, (route) => route.fulfill({ status: 404, body: '{}' }))
    await page.route(LOOKUP_ATLETA, (route) => route.fulfill({ status: 404, body: '{}' }))

    await page.goto(CADASTRO_COM_CONVITE)

    await expect(page.getByRole('heading', { name: /convite inválido ou expirado/i })).toBeVisible()
  })
})
