import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Telas do coach num notebook de resolução menor.
 *
 * **Por que este arquivo existe.** Os outros specs do coach rodam em 1440–1600px. Num notebook de
 * 13" ou num Full HD com escala de 125–150% a largura CSS cai para 1024–1199px — abaixo do `lg` do
 * MUI — e foi nessa faixa que a fila de revisão espremia o detalhe, o roster rolava na horizontal
 * escondendo "Última atividade" e as ações, e a sidebar seguia em 240px. O inbox tem a própria
 * cobertura em `inbox.spec.ts`; aqui ficam as demais telas.
 *
 * O viewport é o pior caso da faixa (1024×640). O que se prova é o fluxo se mantendo: o conteúdo
 * principal visível sem rolar, sem rolagem horizontal da página.
 */

const ME = {
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
}

const PLANO = {
  id: '11111111-1111-1111-1111-111111111111',
  semanaInicio: '2026-08-17',
  semanaFim: '2026-08-23',
  volumePlanejadoKm: 20,
  volumeRealizadoKm: 0,
  volumeAlvoKm: 20,
  status: 'PLANEJADO',
  reviewStatus: 'AGUARDANDO_REVISAO',
  atletaNome: 'Atleta Notebook',
  objetivoSemanal: 'Semana com carga reduzida',
  treinosPlanejados: [
    { id: 't-seg', diaSemana: 'SEGUNDA', tipoTreino: 'CONTINUO', distanciaKm: 8, duracaoMin: 'PT45M' },
  ],
  restDays: [],
}

function roster(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    atletaId: `atleta-${i + 1}`,
    nome: `Atleta Notebook ${i + 1}`,
    status: 'active',
    weeklyVolume: 40 + i,
    ctl: 50,
    atl: 48,
    tsb: 2,
    fase: 'BASE',
    lastActivity: '2026-08-14',
    hasPendingSuggestion: false,
  }))
}

async function mockarApis(page: Page) {
  await page.route('**/api/v1/users/me**', (route) => route.fulfill({ json: ME }))
  await page.route('**/api/v1/coach/attention-queue', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/coach/dashboard*', (route) => route.fulfill({ json: {} }))
  await page.route('**/api/v1/coach/atletas', (route) => route.fulfill({ json: roster(6) }))
  await page.route('**/api/v1/coach/planos/revisao*', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status')
    route.fulfill({ json: status === 'AGUARDANDO_REVISAO' || status === null ? [PLANO] : [] })
  })
  await page.route('**/api/v1/coach/calendario-semanal*', (route) => {
    const from = new URL(route.request().url()).searchParams.get('from') ?? '2026-08-17'
    route.fulfill({
      json: {
        semanaInicio: from,
        semanaFim: from,
        treinos: roster(6).map((a) => ({
          atletaId: a.atletaId,
          nomeAtleta: a.nome,
          data: from,
          tipoTreino: 'CONTINUO',
          isKeyWorkout: false,
          hasAlert: false,
          hasPendingSuggestion: false,
        })),
      },
    })
  })
}

const estouraNaHorizontal = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)

test.describe('Coach em notebook 1024x640', () => {
  test.use({ viewport: { width: 1024, height: 640 } })

  test.beforeEach(async ({ page }) => {
    await mockarApis(page)
    await autenticarComPkce(page, { roles: ['TECNICO'] })
  })

  test('roster: colunas essenciais visíveis sem rolagem horizontal da grade', async ({ page }) => {
    await page.goto('/#/coach/athletes')
    await expect(page.getByText('Atleta Notebook 1')).toBeVisible()

    // O que sustenta a triagem fica; fase, volume e vencimento saem por padrão nesta largura.
    await expect(page.getByRole('columnheader', { name: 'Última atividade' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'TSB' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Fase' })).toHaveCount(0)

    // A última coluna inteira na tela: era ela que sumia atrás da rolagem horizontal da grade.
    // (Não se mede `scrollWidth` do virtualScroller: o DataGrid reserva ~5px para a barra vertical
    // mesmo quando as colunas cabem exatamente, e isso não é rolagem que o coach veja.)
    await expect(page.getByRole('columnheader', { name: 'Ações' })).toBeInViewport({ ratio: 1 })
    expect(await estouraNaHorizontal(page)).toBe(false)
  })

  test('revisão de planos: fila e detalhe lado a lado, com a ação de aprovar à vista', async ({ page }) => {
    await page.goto('/#/coach/planos/revisao')

    const item = page.getByText('Atleta Notebook').first()
    await expect(item).toBeVisible()
    await item.click()
    const aprovar = page.getByRole('button', { name: /^aprovar$/i })
    await expect(aprovar).toBeInViewport()

    const caixaItem = (await item.boundingBox())!
    const caixaAprovar = (await aprovar.boundingBox())!
    expect(caixaAprovar.x).toBeGreaterThan(caixaItem.x + caixaItem.width)
    expect(await estouraNaHorizontal(page)).toBe(false)
  })

  test('calendário: a semana inteira cabe sem rolagem horizontal', async ({ page }) => {
    await page.goto('/#/coach/calendar')
    await expect(page.getByText('Atleta Notebook 1')).toBeVisible()

    const colunaAtleta = (await page.getByText('Atleta Notebook 1').boundingBox())!
    expect(colunaAtleta.x).toBeLessThan(260)
    expect(await estouraNaHorizontal(page)).toBe(false)

    // A grade da semana não precisa rolar: 7 dias + coluna do atleta cabem nos ~960px do conteúdo.
    const rola = await page
      .getByText('Atleta Notebook 1')
      .evaluate((el) => {
        let node: HTMLElement | null = el as HTMLElement
        while (node && getComputedStyle(node).overflowX !== 'auto') node = node.parentElement
        return node ? node.scrollWidth > node.clientWidth : false
      })
    expect(rola).toBe(false)
  })
})
