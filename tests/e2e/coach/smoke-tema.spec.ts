import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Smoke de tipografia do coach e do shell legado (padronizar-tipografia-inter, CA1).
 *
 * O que se verifica é a **primeira família computada** de todo elemento visível com texto próprio:
 * tem de ser Inter, ou JetBrains Mono na exceção dos dados de treino. Afirmar só "sem Syne" deixaria
 * passar fallback de sistema e fonte que não carregou. A revisão de plano roda com plano e zonas
 * preenchidos e o diálogo de zonas aberto, que é a tela que motivou a change; as demais com dados
 * vazios, porque o alvo é a fonte do shell, não o conteúdo.
 */

const PLANO_ID = '11111111-1111-1111-1111-111111111111'
const ATLETA_ID = '33333333-3333-3333-3333-333333333333'

const ME = {
  id: 'coach-1',
  nome: 'Coach',
  email: 'coach@test.dev',
  assessoria: { id: 'tenant-uuid', nome: 'Assessoria Teste' },
  lgpdConsentGranted: true,
  lgpdCurrentPolicyVersion: '2026-06-30',
  lgpdCurrentTermsVersion: '2026-06-30',
  lgpdAcceptedPolicyVersion: '2026-06-30',
  lgpdAcceptedTermsVersion: '2026-06-30',
  onboardingConcluido: true,
}

const PLANO = {
  id: PLANO_ID,
  atletaId: ATLETA_ID,
  semanaInicio: '2026-08-17',
  semanaFim: '2026-08-23',
  volumePlanejadoKm: 40,
  volumeRealizadoKm: 0,
  volumeAlvoKm: 40,
  status: 'PLANEJADO',
  reviewStatus: 'AGUARDANDO_REVISAO',
  atletaNome: 'Atleta Teste',
  objetivoSemanal: 'Base aeróbica',
  treinosPlanejados: [],
}

const FAIXAS = [
  { numero: 1, nome: 'Recuperação', fc: { min: 126, max: 143 }, pace: { minSegKm: 333, maxSegKm: 360 } },
  { numero: 2, nome: 'Aeróbico', fc: { min: 143, max: 150 }, pace: { minSegKm: 305, maxSegKm: 333 } },
  { numero: 3, nome: 'Tempo', fc: { min: 150, max: 158 }, pace: { minSegKm: 290, maxSegKm: 305 } },
  { numero: 4, nome: 'Limiar', fc: { min: 158, max: 168 }, pace: { minSegKm: 276, maxSegKm: 290 } },
  { numero: 5, nome: 'VO2max', fc: { min: 168, max: 178 }, pace: { minSegKm: 261, maxSegKm: 276 } },
  { numero: 6, nome: 'Sprint', fc: null, pace: { minSegKm: 238, maxSegKm: 261 }, motivoFc: 'FC_NAO_ESTABILIZA' },
]

const ZONAS = {
  modelo: 'LTHR_FRIEL',
  ancoras: {
    paceLimiarMinKm: 4.83,
    dataUltimoTestePace: '2026-11-03',
    fcLimiar: 168,
    dataUltimoTesteFc: '2026-09-12',
    fcLimiarEstimada: false,
    fonteLimiarFc: 'TESTE_CAMPO',
    fonteLimiarPace: 'TESTE_CAMPO',
  },
  ajusteFadiga: { segundosPorKm: 0, tsbProntidao: null },
  fcMaxima: { bpm: 185, estimada: false },
  disponibilidade: { pace: true, fc: true, motivoPace: null },
  zonas: FAIXAS,
}

async function mockarApis(page: Page, roles: string[]) {
  // Registrada primeiro: as rotas específicas abaixo têm precedência sobre ela.
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    const objeto = /dashboard|\/settings|\/assessorias\/me|\/onboarding/.test(url)
    route.fulfill({ status: 200, contentType: 'application/json', body: objeto ? '{}' : '[]' })
  })
  await page.route('**/api/v1/users/me**', (route) => route.fulfill({ json: { ...ME, roles } }))
  await page.route('**/api/v1/coach/planos/revisao*', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status')
    route.fulfill({ json: status === 'AGUARDANDO_REVISAO' ? [PLANO] : [] })
  })
  await page.route('**/api/v1/coach/atletas/*/zonas', (route) => route.fulfill({ json: ZONAS }))
  await page.route('**/api/v1/coach/atletas/*/zonas/simulacao', (route) => route.fulfill({ json: ZONAS }))
}

/** Textos visíveis cuja primeira família não é Inter nem JetBrains Mono. */
async function foraDaFamilia(page: Page) {
  return page.evaluate(() => {
    const achados: string[] = []
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const texto = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim() ?? '')
        .join('')
      if (!texto) continue
      const estilo = getComputedStyle(el)
      if (estilo.display === 'none' || estilo.visibility === 'hidden') continue
      const primeira = estilo.fontFamily.split(',')[0].trim().replace(/["']/g, '')
      if (primeira !== 'Inter' && primeira !== 'JetBrains Mono') achados.push(`${primeira}: ${texto.slice(0, 40)}`)
    }
    return achados
  })
}

/** `document.fonts.load` devolve as faces que casaram: vazio quando a Inter nem foi declarada. */
async function interCarregada(page: Page) {
  return page.evaluate(async () => ({
    peso400: (await document.fonts.load('400 16px Inter')).length,
    peso800: (await document.fonts.load('800 16px Inter')).length,
  }))
}

async function verificar(page: Page, nome: string, { scroll = true } = {}) {
  await page.waitForTimeout(800)
  await page.screenshot({ path: `test-results/smoke-tema-${nome}.png`, fullPage: true })

  const estoura = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  if (scroll) expect(estoura, 'scroll horizontal').toBe(false)

  const fora = await foraDaFamilia(page)
  expect(fora, `textos fora de Inter/JetBrains Mono: ${JSON.stringify(fora)}`).toEqual([])

  const carga = await interCarregada(page)
  expect(carga.peso400, 'Inter 400 carregada').toBeGreaterThan(0)
  expect(carga.peso800, 'Inter 800 carregada').toBeGreaterThan(0)
}

test.describe('tipografia do shell do coach', () => {
  for (const tela of [
    { nome: 'inbox', url: '/#/coach/inbox' },
    { nome: 'athletes', url: '/#/coach/athletes' },
    { nome: 'settings', url: '/#/coach/settings' },
  ]) {
    test(`${tela.nome}: tudo em Inter, sem scroll horizontal`, async ({ page }) => {
      await mockarApis(page, ['TECNICO'])
      await autenticarComPkce(page, { roles: ['TECNICO'] })
      await page.goto(tela.url)
      await page.waitForLoadState('networkidle')
      await verificar(page, `coach-${tela.nome}`)
    })
  }

  test('revisão de plano com o diálogo de zonas aberto', async ({ page }) => {
    await mockarApis(page, ['TECNICO'])
    await autenticarComPkce(page, { roles: ['TECNICO'] })
    await page.goto('/#/coach/planos/revisao')
    await page.getByRole('button', { name: /Atleta Teste/i }).click()
    await page.getByRole('button', { name: 'Editar zonas' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('previa-zonas')).toBeVisible()
    await verificar(page, 'coach-revisao-zonas')
  })
})

test.describe('tipografia do shell legado', () => {
  for (const tela of [
    { nome: 'inicio', url: '/#/inicio' },
    { nome: 'atletas', url: '/#/atletas' },
  ]) {
    test(`${tela.nome}: tudo em Inter, sem scroll horizontal`, async ({ page }) => {
      await mockarApis(page, ['ADMIN'])
      await autenticarComPkce(page, { roles: ['ADMIN'] })
      await page.goto(tela.url)
      await page.waitForLoadState('networkidle')
      // A toolbar do DashboardLayout já estoura 8px em develop, antes desta change: o legado só
      // verifica a fonte aqui; o overflow fica registrado como follow-up no tasks.md.
      await verificar(page, `legado-${tela.nome}`, { scroll: false })
    })
  }
})
