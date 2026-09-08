import { test, expect } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'
import { MOCK_ATLETAS } from '../../fixtures/mocks'

/**
 * E2E da geração de plano de UM atleta pelo fluxo assíncrono
 * (change gerar-plano-individual-assincrono).
 *
 * Obrigatório: geração de plano é coach-in-the-loop crítico, e a geração síncrona estourava o
 * proxy_read_timeout de 60s do nginx → 504 para atleta cold-start (a maioria no lançamento). Só o
 * browser real prova a cadeia: o clique dispara `POST /coach/planos/gerar-lote` (202, retorno
 * imediato) — **não** o endpoint síncrono `/planos/atletas/{id}/gerar` — e a UI conclui pelo
 * polling sem travar.
 */

const ATLETAS_URL = '/#/atletas'
const LOTE_API = '**/api/v1/coach/planos/gerar-lote'
const JOB_API = '**/api/v1/coach/planos/lote/*'
const SYNC_API = '**/api/v1/planos/atletas/*/gerar'

test.describe('Gerar plano de um atleta (assíncrono)', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page)
    await page.route('**/api/v1/atletas**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ATLETAS) }),
    )
    // Sem planos → o dialog mostra o botão "Gerar Plano". A rota é GET /api/v1/planos/{atletaId};
    // o `atleta-*-uuid` do mock não colide com os paths /planos/atletas/*/gerar nem /planos/lote/*.
    await page.route('**/api/v1/planos/atleta-*-uuid', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
  })

  test('o clique dispara gerar-lote (202) e NÃO o endpoint síncrono; UI conclui pelo polling', async ({ page }) => {
    let baterNoSincrono = false
    await page.route(SYNC_API, (route) => { baterNoSincrono = true; route.fulfill({ status: 200, body: '{}' }) })

    let corpoLote: Record<string, unknown> = {}
    await page.route(LOTE_API, async (route) => {
      corpoLote = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'job-e2e', totalAtletas: 1 }),
      })
    })

    // Primeiro poll: em progresso; do segundo em diante: terminal com sucesso.
    let polls = 0
    await page.route(JOB_API, async (route) => {
      polls += 1
      const terminal = polls > 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'job-e2e',
          status: terminal ? 'CONCLUIDO' : 'EM_PROGRESSO',
          totalAtletas: 1,
          gerados: terminal ? 1 : 0,
          erros: 0,
          geradosDetalhes: terminal ? [{ atletaId: 'atleta-1-uuid', planoId: 'p1', atletaNome: 'Ana Corredora' }] : [],
          errosDetalhes: [],
        }),
      })
    })

    await page.goto(ATLETAS_URL)
    await expect(page.getByText('Ana Corredora')).toBeVisible()
    await page.getByLabel(/planos de ana corredora/i).click()

    // Dialog aberto: dispara a geração.
    const gerar = page.getByRole('button', { name: /gerar plano/i })
    await expect(gerar).toBeVisible()
    await gerar.click()

    // Feedback assíncrono aparece (retorno imediato do 202) e a geração conclui pelo polling.
    await expect(page.getByText(/gerando o plano com ia/i)).toBeVisible()
    await expect.poll(() => polls).toBeGreaterThan(1)

    // O corpo do lote levou o atleta e o modo; o endpoint síncrono nunca foi chamado.
    expect(corpoLote.atletaIds).toEqual(['atleta-1-uuid'])
    expect(corpoLote.modo).toBe('PROXIMA_SEMANA')
    expect(baterNoSincrono).toBe(false)
  })
})
