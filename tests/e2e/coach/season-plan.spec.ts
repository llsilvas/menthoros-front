import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Aba Temporada do inbox (add-season-plan-generate-tracer): atleta com prova-alvo e sem temporada
 * → "Gerar temporada" → POST → tabela de semanas; e o ajuste da temporada ativa até a versão 2
 * (add-season-plan-adjust-v2). API interceptada.
 */

const INBOX_URL = '/#/coach/inbox'
const SEASON_API = '**/api/v1/atletas/ana/season-plans'
const SEASON_CURRENT_API = '**/api/v1/atletas/ana/season-plans/current'
const CALIBRACAO_API = '**/api/v1/atletas/ana/calibracao'

const ME = {
  id: 'coach-uuid',
  nome: 'Coach Teste',
  email: 'coach@teste.com',
  avatarUrl: null,
  assessoria: { id: 'tenant-uuid', nome: 'Corridas Serra' },
  lgpdConsentGranted: true,
  lgpdCurrentPolicyVersion: '2026-06-30',
  lgpdCurrentTermsVersion: '2026-06-30',
  lgpdAcceptedPolicyVersion: '2026-06-30',
  lgpdAcceptedTermsVersion: '2026-06-30',
  onboardingConcluido: true,
}

const PROVA_ALVO = {
  id: 'prova-1',
  nomeProva: 'Maratona de São Paulo',
  dataProva: '2027-04-04',
  tipoProva: 'MARATONA',
  distancia: 'KM_42',
  provaAlvo: true,
  statusProva: 'PLANEJADA',
}

const PERFIL = {
  atletaId: 'ana',
  nomeAtleta: 'Ana Silva',
  objetivo: null,
  proximaProva: PROVA_ALVO,
  provas: [PROVA_ALVO],
  nivelExperiencia: null,
  pmc: [],
  aderenciaSemanal: [],
  planoVigente: null,
  sinaisRecentes: [],
  sugestoesRecentes: [],
  recordes: [],
  melhoresEsforcos: [],
  melhoresEsforcosIntegracaoConectada: true,
  geradoEm: '2026-11-16T12:00:00Z',
  avisos: null,
}

const TEMPORADA = {
  id: 'season-1',
  seasonStatus: 'PROPOSED',
  provaId: 'prova-1',
  provaNome: 'Maratona de São Paulo',
  provaData: '2027-04-04',
  shortPreparation: false,
  totalWeeks: 2,
  initialCtl: 40,
  peakVolumeKm: 52,
  weeks: [
    { weekIndex: 1, weekStart: '2027-03-22', phase: 'TAPER', targetVolumeKm: 31.2, targetTss: 218, deload: false, longRunKm: 8.7, valueSource: 'ENGINE', locked: false },
    { weekIndex: 2, weekStart: '2027-03-29', phase: 'RACE_WEEK', targetVolumeKm: 23.4, targetTss: 164, deload: false, valueSource: 'ENGINE', locked: true, lockReason: 'RACE_WEEK' },
  ],
  milestones: [{ weekIndex: 1, provaId: 'prova-2', name: 'Meia de teste', date: '2027-03-27', distance: { value: '21K', label: '21 km (Meia Maratona)', short: '21K', order: 3 } }],
  validations: [
    { rule: 'TAPER_DEPTH', severity: 'WARN', weekIndex: 1, measured: 40.1, limit: 55.5, message: 'Redução de 40,1% sobre o pico; a curva de polimento pede 55,5%' },
  ],
}

async function mockarApi(page: Page) {
  await page.route('**/api/v1/users/me**', (route) => route.fulfill({ json: ME }))
  await page.route('**/api/v1/coach/dashboard*', (route) =>
    route.fulfill({
      json: {
        generatedAt: '2026-11-16T12:00:00Z',
        summary: {
          kpis: { totalAtletas: 1, ativos: 1, emAtencao: 0, treinosPlanejadosSemana: 0 },
          atletasExibidos: 1,
          itensFilaAtencao: 0,
        },
        roster: {
          items: [{ atletaId: 'ana', nome: 'Ana Silva', status: 'active', weeklyVolume: 40, aderenciaPercentual: 80, lastActivity: '2026-11-15' }],
          page: 0, size: 10, totalElements: 1, totalPages: 1,
        },
        attentionQueue: [],
      },
    }),
  )
  await page.route('**/api/v1/coach/planos/**', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/atletas/**', (route) => route.fulfill({ json: {} }))
  await page.route('**/api/v1/coach/atletas/*/perfil', (route) => route.fulfill({ json: PERFIL }))
  await page.route(SEASON_CURRENT_API, (route) => route.fulfill({ status: 204 }))
  await page.route(CALIBRACAO_API, (route) => route.fulfill({ status: 204 }))
}

test.describe('Coach — aba Temporada do inbox', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['PROPRIETARIO', 'TECNICO'] })
  })

  test('gera a temporada e mostra a tabela de semanas', async ({ page }) => {
    await mockarApi(page)
    let posts = 0
    await page.route(SEASON_API, (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      posts += 1
      return route.fulfill({ status: 201, json: TEMPORADA })
    })

    await page.goto(INBOX_URL)
    await page.getByRole('tab', { name: /Temporada/i }).click()

    const gerar = page.getByRole('button', { name: 'Gerar temporada' })
    await expect(gerar).toBeVisible()
    await gerar.click()

    await expect(page.getByText(/Proposta de temporada até Maratona de São Paulo/)).toBeVisible()
    const linhas = page.getByRole('table', { name: 'Semanas da temporada' }).getByRole('row')
    await expect(linhas).toHaveCount(3)
    await expect(linhas.nth(1)).toContainText('Polimento')
    await expect(linhas.nth(2)).toContainText('Semana da prova')
    await expect(linhas.nth(2)).toContainText('164')
    await expect(linhas.nth(1)).toContainText('8,7 km')
    await expect(page.getByRole('img', { name: /Mapa da temporada: 2 semanas.*Meia de teste na semana 1/ })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Marcos' })).toContainText('Meia de teste · Semana 1 · 27/03')
    await expect(page.getByRole('list', { name: 'Validações' })).toContainText('a curva de polimento pede 55,5%')
    expect(posts).toBe(1)
  })

  test('atleta em calibração: "Gerar temporada" desabilitada com a semana', async ({ page }) => {
    await mockarApi(page)
    await page.route(CALIBRACAO_API, (route) =>
      route.fulfill({ json: { phase: 'CALIBRATION', stage: 'CALIBRATION', weekNumber: 2, confidenceScore: 40 } }),
    )

    await page.goto(INBOX_URL)
    await page.getByRole('tab', { name: /Temporada/i }).click()

    await expect(page.getByText(/Atleta em calibração \(semana 2\)/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gerar temporada' })).toBeDisabled()
  })

  test('treinador aprova a proposta: a faixa e o botão somem', async ({ page }) => {
    await mockarApi(page)
    await page.route(SEASON_CURRENT_API, (route) => route.fulfill({ json: TEMPORADA }))
    let aprovacoes = 0
    await page.route('**/api/v1/atletas/ana/season-plans/season-1/approve', (route) => {
      if (route.request().method() !== 'POST') return route.fulfill({ status: 405 })
      aprovacoes += 1
      return route.fulfill({ json: { ...TEMPORADA, seasonStatus: 'ACTIVE', approvedAt: '2026-11-20T13:00:00Z' } })
    })

    await page.goto(INBOX_URL)
    await page.getByRole('tab', { name: /Temporada/i }).click()
    await page.getByRole('button', { name: 'Aprovar temporada' }).click()

    await expect(page.getByText(/Proposta de temporada até/)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Aprovar temporada' })).toHaveCount(0)
    await expect(page.getByRole('table', { name: 'Semanas da temporada' })).toBeVisible()
    expect(aprovacoes).toBe(1)
  })

  test('ajusta a temporada ativa: edita uma semana futura, aprova com motivo e vê a versão 2 na aba', async ({ page }) => {
    await mockarApi(page)
    const semanas = [
      { weekIndex: 1, weekStart: '2027-03-15', phase: 'BUILD', targetVolumeKm: 40, targetTss: 300, deload: false, longRunKm: 14, valueSource: 'ENGINE', locked: true, lockReason: 'IN_PROGRESS' },
      { weekIndex: 2, weekStart: '2027-03-22', phase: 'TAPER', targetVolumeKm: 31.2, targetTss: 218, deload: false, longRunKm: 8.7, valueSource: 'ENGINE', locked: false },
      { weekIndex: 3, weekStart: '2027-03-29', phase: 'RACE_WEEK', targetVolumeKm: 23.4, targetTss: 164, deload: false, valueSource: 'ENGINE', locked: true, lockReason: 'RACE_WEEK' },
    ]
    const ATIVA = { ...TEMPORADA, seasonStatus: 'ACTIVE', approvedAt: '2026-11-20T13:00:00Z', totalWeeks: 3, version: 1, weeks: semanas }
    const RASCUNHO = { ...ATIVA, id: 'season-2', seasonStatus: 'PROPOSED', approvedAt: undefined, version: 2, baseSeasonPlanId: 'season-1' }
    const EDITADO = {
      ...RASCUNHO,
      weeks: semanas.map((w) => (w.weekIndex === 2 ? { ...w, targetVolumeKm: 28, keySessions: '4x1km', valueSource: 'COACH' } : w)),
    }
    let aprovada = false
    let edicao: unknown = null
    let motivo: unknown = null
    await page.route(SEASON_CURRENT_API, (route) =>
      route.fulfill({ json: aprovada ? { ...EDITADO, seasonStatus: 'ACTIVE', approvedAt: '2027-03-16T12:00:00Z' } : ATIVA }),
    )
    await page.route('**/api/v1/atletas/ana/season-plans/season-1/draft', (route) =>
      route.fulfill({ status: 201, json: RASCUNHO }),
    )
    await page.route('**/api/v1/atletas/ana/season-plans/season-2', (route) =>
      route.fulfill({ json: edicao ? EDITADO : RASCUNHO }),
    )
    await page.route('**/api/v1/atletas/ana/season-plans/season-2/weeks/2', (route) => {
      edicao = route.request().postDataJSON()
      return route.fulfill({ json: EDITADO })
    })
    await page.route('**/api/v1/atletas/ana/season-plans/season-2/approve', (route) => {
      motivo = route.request().postDataJSON()
      aprovada = true
      return route.fulfill({ json: { ...EDITADO, seasonStatus: 'ACTIVE', approvedAt: '2027-03-16T12:00:00Z' } })
    })

    await page.goto(INBOX_URL)
    await page.getByRole('tab', { name: /Temporada/i }).click()
    await page.getByRole('button', { name: 'Ajustar temporada' }).click()

    await expect(page.getByRole('heading', { name: 'Ajuste da temporada' })).toBeVisible()
    const tabela = page.getByRole('table', { name: 'Semanas do ajuste' })
    await expect(tabela.getByTestId('adjust-week-1')).toContainText('Em andamento')
    await expect(page.getByRole('button', { name: 'Editar semana 1' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Editar semana 2' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Semana 2' })
    await dialogo.getByLabel(/Volume \(km\)/).fill('28')
    await dialogo.getByLabel('Sessões-chave').fill('4x1km')
    await dialogo.getByRole('button', { name: 'Salvar' }).click()
    await expect(dialogo).toHaveCount(0)
    await expect(tabela.getByTestId('adjust-week-2')).toContainText('4x1km')
    expect(edicao).toMatchObject({ targetVolumeKm: 28, keySessions: '4x1km' })

    const aprovar = page.getByRole('button', { name: 'Aprovar nova versão' })
    await expect(aprovar).toBeDisabled()
    await page.getByLabel(/Motivo do ajuste/).fill('Atleta perdeu uma semana por gripe')
    await aprovar.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Aprovar' }).click()

    await expect(page.getByText('Temporada aprovada · versão 2.')).toBeVisible()
    await expect(page.getByRole('table', { name: 'Semanas da temporada' })).toBeVisible()
    expect(motivo).toEqual({ reason: 'Atleta perdeu uma semana por gripe' })
  })

  test('celular: a edição abre em tela cheia e descartar o ajuste volta à aba com a versão 1', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockarApi(page)
    const semanas = [
      { weekIndex: 1, weekStart: '2027-03-22', phase: 'TAPER', targetVolumeKm: 31.2, targetTss: 218, deload: false, longRunKm: 8.7, valueSource: 'ENGINE', locked: false },
      { weekIndex: 2, weekStart: '2027-03-29', phase: 'RACE_WEEK', targetVolumeKm: 23.4, targetTss: 164, deload: false, valueSource: 'ENGINE', locked: true, lockReason: 'RACE_WEEK' },
    ]
    const ATIVA = { ...TEMPORADA, seasonStatus: 'ACTIVE', approvedAt: '2026-11-20T13:00:00Z', version: 1, weeks: semanas }
    let descartado = false
    await page.route(SEASON_CURRENT_API, (route) =>
      route.fulfill({ json: descartado ? ATIVA : { ...ATIVA, openDraftId: 'season-2' } }),
    )
    await page.route('**/api/v1/atletas/ana/season-plans/season-2', (route) => {
      if (route.request().method() === 'DELETE') {
        descartado = true
        return route.fulfill({ status: 204 })
      }
      return route.fulfill({ json: { ...ATIVA, id: 'season-2', seasonStatus: 'PROPOSED', version: 2, baseSeasonPlanId: 'season-1' } })
    })

    await page.goto(INBOX_URL)
    await page.getByRole('tab', { name: /Temporada/i }).click()
    await page.getByRole('button', { name: 'Continuar ajuste' }).click()

    await page.getByRole('button', { name: 'Editar semana 1' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Semana 1' })
    const caixa = await dialogo.boundingBox()
    expect(caixa?.width).toBeGreaterThanOrEqual(380)
    await dialogo.getByRole('button', { name: 'Cancelar' }).click()

    await page.getByRole('button', { name: 'Descartar ajuste' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Descartar' }).click()

    await expect(page.getByRole('button', { name: 'Ajustar temporada' })).toBeVisible()
    expect(descartado).toBe(true)
  })

  test('flag desligada no backend: a aba não aparece', async ({ page }) => {
    await mockarApi(page)
    await page.route(SEASON_CURRENT_API, (route) =>
      route.fulfill({ status: 404, json: { status: 404, error: 'Not Found', code: 'SEASON_PLAN_DISABLED' } }),
    )

    await page.goto(INBOX_URL)
    await expect(page.getByRole('tab', { name: /Diagnóstico/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Temporada/i })).toHaveCount(0)
  })
})
