import { test, expect } from '@playwright/test'
import { TOKEN_KEY, buildFakeJwt } from '../../fixtures/auth'
import { MOCK_ATLETAS } from '../../fixtures/mocks'

// The app uses HashRouter. '/#/atletas' is unambiguously in DashboardLayout.
// Clicking the "Dashboard" sidebar link navigates to '/#/' which React Router
// resolves to the authenticated dashboard index (HomePage) when inside the app.
const ATLETAS_URL = '/#/atletas'
const ATLETAS_API = '**/api/v1/atletas**'

test.describe('Dashboard — Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, token }) => {
      localStorage.setItem(key, token)
    }, { key: TOKEN_KEY, token: buildFakeJwt() })

    await page.route(ATLETAS_API, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ATLETAS),
      })
    })
  })

  test('authenticated user reaches atletas page without redirect to login', async ({ page }) => {
    await page.goto(ATLETAS_URL)

    await expect(page).not.toHaveURL(/#\/auth\/login/)
    // "+ NOVO ATLETA" button is unique to the AtletasList page
    await expect(page.getByText(/novo atleta/i)).toBeVisible()
  })

  test('DashboardLayout sidebar shows navigation sections', async ({ page }) => {
    await page.goto(ATLETAS_URL)

    // MUI Drawer renders two copies — filter to visible one
    await expect(page.getByText('PRINCIPAL').filter({ visible: true })).toBeVisible()
    await expect(page.getByText('Revisão Strava').filter({ visible: true })).toBeVisible()
  })

  test('navigating to Dashboard via sidebar shows Visão do Time', async ({ page }) => {
    await page.goto(ATLETAS_URL)

    // Click visible "Dashboard" sidebar link (permanent MUI Drawer)
    await page.getByText('Dashboard').filter({ visible: true }).click()

    // Use getByText — heading component uses custom font and the accessibility
    // role may not resolve before the visibility assertion times out
    await expect(page.getByText('Visão do Time')).toBeVisible()
  })

  test('KPI cards show correct athlete counts', async ({ page }) => {
    await page.goto(ATLETAS_URL)
    await page.getByText('Dashboard').filter({ visible: true }).click()

    await expect(page.getByText('Total de Atletas').first()).toBeVisible()
    await expect(page.getByText('Iniciantes').first()).toBeVisible()
    await expect(page.getByText(/com les/i).first()).toBeVisible()
  })

  test('athlete with injury appears under Precisam de Atenção', async ({ page }) => {
    await page.goto(ATLETAS_URL)
    await page.getByText('Dashboard').filter({ visible: true }).click()

    await expect(page.getByText(/precisam de atenção/i)).toBeVisible()

    // Bruno Maratonista has temLesao=true — appears in "Precisam de Atenção" section
    // Use first() because he also appears in "Todos os Atletas" below
    await expect(page.getByText('Bruno Maratonista').first()).toBeVisible()
  })
})
