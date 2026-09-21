import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce, aguardarFluxoEstavel } from '../../fixtures/pkceAuth'

/**
 * Banner offline do shell do atleta (add-athlete-pwa-ux-hints, task 1.5).
 *
 * Roda no shell do ATLETA (`/#/athlete/home`) — `/#/atletas` com o papel padrão monta o
 * `DashboardLayout` do coach, onde o slot não existe (DoR). Mocks mínimos copiados de
 * `tests/e2e/athlete/home.spec.ts` (função local de lá, não exportada) sobre um catch-all
 * registrado ANTES: sob `vite preview` qualquer rota não mockada cai no proxy morto e enche a home
 * de estados de erro, o que deixaria o baseline "sem banner" ambíguo. O Playwright dá precedência
 * ao handler registrado por último, então os nomeados vencem o catch-all.
 *
 * Sem reload: a sessão vive em memória e sobrevive ao `setOffline`; o SW registra mas não
 * controla a página (mesmo regime dos outros specs). O hint iOS não é testável no Desktop Chrome
 * (`navigator.standalone` é só do MobileSafari) — evidência manual.
 */

const HOME_URL = '/#/athlete/home'

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

const ME = {
  id: 'user-uuid',
  atletaId: 'atleta-uuid',
  nome: 'Marina Teste',
  email: 'marina@teste.com',
  avatarUrl: null,
  assessoria: { id: 'tenant-uuid', nome: 'Corridas Serra' },
  lgpdConsentGranted: true,
  onboardingConcluido: true,
}

const HOME = {
  proximoTreino: {
    data: new Date().toISOString().slice(0, 10),
    tipoTreino: 'CONTINUO',
    descricao: 'Rodagem leve',
    duracaoMin: 40,
    zonaAlvo: 'Z2',
    tssPlanejado: 40,
    intensidadePlanejada: 0.7,
    etapas: [{ ordem: 1, tipoEtapa: 'ESFORCO', duracaoMin: 40, descricaoEtapa: 'Rodagem' }],
  },
  metricasChave: { ctl: 48, atl: 40, tsb: 8, tss: 52, statusForma: 'FORMA_IDEAL' },
}

async function mockarHomeMinima(page: Page) {
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json(ME)))
  await page.route('**/api/v1/atletas/me/home', (route) => route.fulfill(json(HOME)))
  await page.route('**/api/v1/atletas/me/readiness', (route) =>
    route.fulfill(json({ score: 78, classificacao: 'PRONTO', nota: 'Mantenha o plano.' })),
  )
  await page.route('**/api/v1/checkins/atleta-uuid/atual', (route) => route.fulfill({ status: 204, body: '' }))
  // `[]` do catch-all viraria "status de calibração válido" com campos undefined — 204 como o spec da home.
  await page.route('**/api/v1/atletas/atleta-uuid/calibracao**', (route) => route.fulfill({ status: 204, body: '' }))
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('PWA — banner offline no shell do atleta', () => {
  test('aparece ao ficar offline e some ao voltar, sem reload', async ({ page, context }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockarHomeMinima(page)
    await page.goto(HOME_URL)
    await aguardarFluxoEstavel(page)

    await expect(page.getByRole('navigation', { name: /navegação do atleta/i })).toBeVisible()
    await expect(page.getByText(/Você está offline/)).toHaveCount(0)

    await context.setOffline(true)
    await expect(page.getByRole('status').filter({ hasText: /Você está offline/ })).toBeVisible()

    await context.setOffline(false)
    await expect(page.getByText(/Você está offline/)).toHaveCount(0)
    await expect(page).not.toHaveURL(/#\/auth\/login/)
  })
})
