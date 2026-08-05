import { test, expect } from '@playwright/test'
import { MOCK_ATLETAS } from '../../fixtures/mocks'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

const ATLETAS_URL = '/#/atletas'
const ATLETAS_API = '**/api/v1/atletas**'

test.describe('Atletas — Lista', () => {
  test.beforeEach(async ({ page }) => {
    // Autentica pelo fluxo PKCE real, contra um IdP falso: injetar token em localStorage deixou de
    // funcionar quando a sessão passou a viver em memória (ver `fixtures/pkceAuth`).
    await autenticarComPkce(page)
  })

  test('renders athletes list with mocked data', async ({ page }) => {
    await page.route(ATLETAS_API, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ATLETAS),
      })
    })

    await page.goto(ATLETAS_URL)

    // URL stayed on atletas (not redirected to login)
    await expect(page).not.toHaveURL(/#\/auth\/login/)

    // Athletes from mock data are visible
    await expect(page.getByText('Ana Corredora')).toBeVisible()
    await expect(page.getByText('Bruno Maratonista')).toBeVisible()
    await expect(page.getByText('Carla Iniciante')).toBeVisible()
  })

  test('shows empty state when no athletes', async ({ page }) => {
    await page.route(ATLETAS_API, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto(ATLETAS_URL)

    await expect(page.getByText(/nenhum atleta/i)).toBeVisible()
  })

  test('data is absent while API is pending and appears on response', async ({ page }) => {
    let unblock!: () => void
    const blocked = new Promise<void>((resolve) => { unblock = resolve })

    await page.route(ATLETAS_API, async (route) => {
      await blocked
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ATLETAS),
      })
    })

    await page.goto(ATLETAS_URL)

    // While API is blocked, athletes should not be rendered yet
    await expect(page.getByText('Ana Corredora')).not.toBeVisible()

    // Release the blocked response
    unblock()

    // Athletes appear after the API responds
    await expect(page.getByText('Ana Corredora')).toBeVisible()
    await expect(page.getByText('Bruno Maratonista')).toBeVisible()
  })

  test('shows error message when API fails', async ({ page }) => {
    await page.route(ATLETAS_API, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      })
    })

    await page.goto(ATLETAS_URL)

    // AtletasList renders an Alert with the error — match by text since MUI Alert
    // in dark mode may not reliably expose role="alert" to Playwright's ARIA tree
    await expect(page.getByText(/internal server error|erro/i).first()).toBeVisible()
  })
})
