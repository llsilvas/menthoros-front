import { test, expect } from '@playwright/test'
import { TOKEN_KEY, buildFakeJwt, EXPIRED_JWT } from '../../fixtures/auth'
import { MOCK_KEYCLOAK_TOKEN_RESPONSE } from '../../fixtures/mocks'

// The app uses HashRouter: all routes are prefixed with #
const LOGIN_URL = '/#/auth/login'
const ATLETAS_URL = '/#/atletas'
const KEYCLOAK_TOKEN_PATH = '**/realms/menthoros/protocol/openid-connect/token'

test.describe('Login', () => {
  test('unauthenticated user accessing a protected page is redirected to login', async ({ page }) => {
    await page.goto(ATLETAS_URL)

    await expect(page).toHaveURL(/#\/auth\/login/)
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible()
  })

  test('expired token is treated as unauthenticated', async ({ page }) => {
    await page.addInitScript(({ key, token }) => {
      localStorage.setItem(key, token)
    }, { key: TOKEN_KEY, token: EXPIRED_JWT })

    await page.goto(ATLETAS_URL)

    await expect(page).toHaveURL(/#\/auth\/login/)
  })

  test('shows login form with username and password fields', async ({ page }) => {
    await page.goto(LOGIN_URL)

    await expect(page.getByLabel(/email ou usuário/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('submit button is disabled until both fields are filled', async ({ page }) => {
    await page.goto(LOGIN_URL)

    const submitBtn = page.getByRole('button', { name: /entrar/i })
    await expect(submitBtn).toBeDisabled()

    await page.getByLabel(/email ou usuário/i).fill('coach@teste.com')
    await expect(submitBtn).toBeDisabled()

    await page.getByLabel(/senha/i).fill('minhasenha')
    await expect(submitBtn).toBeEnabled()
  })

  test('successful login stores token and navigates away from login', async ({ page }) => {
    // Mock Keycloak returning a token — the frontend stores it and navigates
    await page.route(KEYCLOAK_TOKEN_PATH, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_KEYCLOAK_TOKEN_RESPONSE,
          // Override access_token with a valid-format fake JWT so AuthContext accepts it
          access_token: buildFakeJwt(),
        }),
      })
    })

    await page.goto(LOGIN_URL)
    await page.getByLabel(/email ou usuário/i).fill('coach@teste.com')
    await page.getByLabel(/senha/i).fill('senhavalida')
    await page.getByRole('button', { name: /entrar/i }).click()

    // Token stored in localStorage
    const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY)
    expect(token).toBeTruthy()

    // No longer on login page
    await expect(page).not.toHaveURL(/#\/auth\/login/)
  })

  test('shows error message on invalid credentials', async ({ page }) => {
    await page.route(KEYCLOAK_TOKEN_PATH, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid user credentials' }),
      })
    })

    await page.goto(LOGIN_URL)
    await page.getByLabel(/email ou usuário/i).fill('wrong@user.com')
    await page.getByLabel(/senha/i).fill('senhaerrada')
    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText(/credenciais inválidas/i)
  })
})
