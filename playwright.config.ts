import { defineConfig, devices } from '@playwright/test'
import { APP_ORIGIN, IDP_CLIENT_ID, IDP_ORIGIN, IDP_REALM, PORTA_E2E } from './tests/fixtures/idp'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.BASE_URL ?? APP_ORIGIN,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  /**
   * Sobe a aplicação antes dos testes.
   *
   * Sem isto, `npm run test:e2e` só funciona para quem já tem `npm run dev` aberto — e falha em
   * 100% dos casos num runner limpo, antes da primeira asserção. O sintoma (todos os specs
   * vermelhos) não se parece com "faltou servidor", então o CI nasceria vermelho por motivo alheio
   * ao produto, que é o jeito mais rápido de ensinar a equipe a ignorá-lo.
   *
   * Usa `preview` sobre o build (o mesmo artefato que vai para produção) em vez de `dev`: evita
   * testar contra HMR e transformação de desenvolvimento, que não existem em produção.
   *
   * **Servidor próprio, sempre** — porta dedicada e `reuseExistingServer: false`. Reaproveitar o
   * `npm run dev` de quem está trabalhando faria a suíte rodar com o `.env` daquela máquina, que é
   * precisamente o acoplamento que fez 10 specs passarem aqui e falharem no runner.
   *
   * O `env` fixa a identidade do provedor: é o que a fixture PKCE intercepta. Variável já presente
   * no processo tem prioridade sobre arquivo `.env` no Vite, então isto vence o `.env` local sem
   * precisar removê-lo.
   */
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORTA_E2E} --strictPort`,
    url: APP_ORIGIN,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      VITE_KEYCLOAK_URL: IDP_ORIGIN,
      VITE_KEYCLOAK_REALM: IDP_REALM,
      VITE_KEYCLOAK_CLIENT_ID: IDP_CLIENT_ID,
    },
  },
})
