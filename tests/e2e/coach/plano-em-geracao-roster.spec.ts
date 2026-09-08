import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * E2E da change plano-em-geracao-no-roster (coach-in-the-loop — geração de plano é fluxo crítico).
 *
 * Prova o que o unit não vê (AC4 + AC2): o coach dispara a geração de um atleta, **fecha o dialog**,
 * e a LINHA do roster continua mostrando "Gerando plano…" e vira "Plano gerado agora" sozinha —
 * o acompanhamento vive no PlanGenerationProvider (nível coach), não no dialog. Só o browser real
 * prova que o sinal sobrevive ao fechamento e que a UI conclui pelo polling.
 */

const ATLETA_ID = 'atleta-e2e-1'
const ATLETA_NOME = 'Bruno Dias'
const JOB_ID = 'job-roster-e2e'

const ATLETAS_URL = '/#/coach/athletes'
const ME_API = '**/api/v1/users/me**'
const ROSTER_API = '**/api/v1/coach/atletas'
const QUEUE_API = '**/api/v1/coach/attention-queue'
const REVIEW_API = '**/api/v1/coach/planos/revisao*'
const PLANOS_ATLETA_API = `**/api/v1/planos/${ATLETA_ID}`
const LOTE_API = '**/api/v1/coach/planos/gerar-lote'
const JOB_API = '**/api/v1/coach/planos/lote/*'
const SYNC_API = '**/api/v1/planos/atletas/*/gerar'

async function mockarShell(page: Page) {
  await page.route(ME_API, (route) =>
    route.fulfill({
      json: {
        id: 'coach-1',
        nome: 'Coach',
        email: 'coach@test.dev',
        roles: ['TECNICO'],
        assessoria: { id: 'tenant-uuid', nome: 'Assessoria Teste' },
        lgpdConsentGranted: true,
        lgpdCurrentPolicyVersion: '2026-06-30',
        lgpdCurrentTermsVersion: '2026-06-30',
        lgpdAcceptedPolicyVersion: '2026-06-30',
        lgpdAcceptedTermsVersion: '2026-06-30',
        onboardingConcluido: true,
      },
    }),
  )
  await page.route(QUEUE_API, (route) => route.fulfill({ json: [] }))
  await page.route(REVIEW_API, (route) => route.fulfill({ json: [] }))
  await page.route(ROSTER_API, (route) =>
    route.fulfill({
      json: [{ atletaId: ATLETA_ID, nome: ATLETA_NOME, status: 'active', weeklyVolume: 48 }],
    }),
  )
  // Sem planos → o dialog mostra "Gerar Plano".
  await page.route(PLANOS_ATLETA_API, (route) => route.fulfill({ json: [] }))
}

test.describe('Plano em geração na linha do roster', () => {
  test('dispara, FECHA o dialog e a linha conclui sozinha; um único gerar-lote, nunca o síncrono', async ({ page }) => {
    await mockarShell(page)
    await autenticarComPkce(page, { roles: ['TECNICO'] })

    let baterNoSincrono = false
    await page.route(SYNC_API, (route) => {
      baterNoSincrono = true
      route.fulfill({ status: 200, body: '{}' })
    })

    let lotePosts = 0
    await page.route(LOTE_API, async (route) => {
      lotePosts += 1
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: JOB_ID, totalAtletas: 1 }),
      })
    })

    // Terminal por TEMPO (não por contagem de polls): o dialog e o provider polam o mesmo job em
    // paralelo, então contar polls faria o terminal chegar em <1s e o estado "gerando" some antes
    // de o teste vê-lo. ~3s de EM_PROGRESSO garantem que a linha mostre "Gerando plano…".
    let t0 = 0
    await page.route(JOB_API, async (route) => {
      if (t0 === 0) t0 = Date.now()
      const terminal = Date.now() - t0 > 3000
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: JOB_ID,
          status: terminal ? 'CONCLUIDO' : 'EM_PROGRESSO',
          totalAtletas: 1,
          gerados: terminal ? 1 : 0,
          erros: 0,
          geradosDetalhes: terminal ? [{ atletaId: ATLETA_ID, planoId: 'p1', atletaNome: ATLETA_NOME }] : [],
          errosDetalhes: [],
        }),
      })
    })

    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto(ATLETAS_URL)
    await expect(page.getByText(ATLETA_NOME)).toBeVisible()

    // Abre o menu de ações da linha (⋮ na coluna de ações) e escolhe "Plano".
    await page.locator('[data-field="actions"] button').first().click()
    await page.getByRole('menuitem', { name: 'Plano' }).click()

    // Dispara a geração e FECHA o dialog (o diferencial do AC4). Enquanto o dialog (modal) está
    // aberto ele cobre a linha, então o sinal do roster só é verificável após fechar.
    await page.getByRole('button', { name: /gerar plano/i }).click()
    await page.keyboard.press('Escape')

    // Com o dialog fechado, a linha segue "gerando" e conclui sozinha pelo polling.
    await expect(page.getByText(/gerando plano…/i)).toBeVisible()
    await expect(page.getByText(/plano gerado agora/i)).toBeVisible({ timeout: 15_000 })

    // Um único POST de lote; o endpoint síncrono nunca foi chamado.
    expect(lotePosts).toBe(1)
    expect(baterNoSincrono).toBe(false)
  })
})
