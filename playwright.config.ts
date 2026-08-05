import { defineConfig, devices } from '@playwright/test'

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
    baseURL: process.env.BASE_URL ?? 'http://localhost:5174',
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
   * `reuseExistingServer` fora de CI: quem já está com o dev server aberto não paga por outro, e o
   * teste local usa o mesmo processo que a pessoa está olhando. No CI, sempre sobe um limpo.
   *
   * Usa `preview` sobre o build (o mesmo artefato que vai para produção) em vez de `dev`: evita
   * testar contra HMR e transformação de desenvolvimento, que não existem em produção.
   */
  webServer: {
    command: process.env.CI ? 'npm run build && npm run preview -- --port 5174' : 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
