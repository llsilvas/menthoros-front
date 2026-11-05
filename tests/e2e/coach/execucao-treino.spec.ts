import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Tela de execução do treino realizado — `coach-ver-treino-realizado` (CA1–CA11).
 *
 * O fluxo cruza o contrato da API (detalhe do realizado, análise, resumo do perfil): aqui rodam
 * roteador e rede reais, só o backend é interceptado — mesmo padrão dos demais specs do coach.
 * Cobre os dois pontos de entrada (Planos pelo roster e o perfil do atleta no shell) e a análise
 * 204 com e sem RPE.
 */

const ATLETA_ID = 'atleta-e2e-1'
const ATLETA_NOME = 'Bruno Dias'
const REALIZADO_ID = 'tr-e2e-1'

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

/** Forma do `GET /api/v1/treinos/realizados/{id}` (D3) para o .fit de 15 km dos testes do backend. */
const DETALHE = {
  id: REALIZADO_ID,
  tipoTreino: 'LONGO',
  duracaoMin: '01:40:32',
  distanciaKm: 15.0,
  fcMedia: 152,
  fcMax: 171,
  velocidadeMedia: 9.62,
  percepcaoEsforco: 7,
  feedbackAtleta: 'Pernas pesadas no fim',
  runningDynamics: { tempoMovimento: '01:33:33', temperaturaMediaC: 22.0 },
  velocidadeMaxKmh: 12.19,
  temperaturaMinC: 19.0,
  temperaturaMaxC: 27.0,
  tempoEmZonas: {
    fonte: 'FIT_RECORDS',
    zonas: [
      { zona: 'Z1', bpmMin: 93, bpmMax: 111, segundos: 4 },
      { zona: 'Z2', bpmMin: 112, bpmMax: 129, segundos: 108 },
      { zona: 'Z3', bpmMin: 130, bpmMax: 148, segundos: 4314 },
      { zona: 'Z4', bpmMin: 149, bpmMax: 166, segundos: 1198 },
      { zona: 'Z5', bpmMin: 167, segundos: 15 },
    ],
  },
  etapasRealizadas: Array.from({ length: 16 }, (_, i) => ({
    ordem: i + 1, duracao: '06:14', distanciaKm: i === 15 ? 0.0 : 1.0, fcMedia: 140 + i, fcMax: 150 + i, velocidadeMedia: 9.62,
  })),
}

const ANALISE = {
  id: 'a1', treinoRealizadoId: REALIZADO_ID, status: 'COMPLETED', primaryCause: 'PACING_ERROR',
  executionScore: 72, summary: 'Saiu forte demais no início', recommendation: 'Segurar os 3 primeiros km',
}

type Rotas = { detalhe?: Record<string, unknown>; analise?: unknown | null; chamadasAnalise: number }

async function mockarComum(page: Page, rotas: Rotas) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await autenticarComPkce(page, { roles: ['TECNICO'] })
  await page.route('**/api/**', (route) => route.fulfill(json({})))
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json({
    id: 'coach-1', nome: 'Coach', email: 'coach@test.dev', roles: ['TECNICO'],
    assessoria: { id: 'tenant-uuid', nome: 'Assessoria Teste' }, lgpdConsentGranted: true,
    lgpdCurrentPolicyVersion: '2026-06-30', lgpdCurrentTermsVersion: '2026-06-30',
    lgpdAcceptedPolicyVersion: '2026-06-30', lgpdAcceptedTermsVersion: '2026-06-30',
    onboardingConcluido: true,
  })))
  await page.route(`**/api/v1/treinos/realizados/${REALIZADO_ID}`, (route) => route.fulfill(json(rotas.detalhe ?? DETALHE)))
  await page.route(`**/api/v1/analises/treino/${REALIZADO_ID}`, (route) => {
    rotas.chamadasAnalise += 1
    return rotas.analise == null ? route.fulfill({ status: 204, body: '' }) : route.fulfill(json(rotas.analise))
  })
}

async function abrirPlanosPeloRoster(page: Page, rpe: number | undefined) {
  await page.route('**/api/v1/coach/atletas', (route) =>
    route.fulfill(json([{ atletaId: ATLETA_ID, nome: ATLETA_NOME, status: 'active', weeklyVolume: 48 }])))
  await page.route('**/api/v1/coach/attention-queue', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/coach/planos/revisao*', (route) => route.fulfill(json([])))
  await page.route(`**/api/v1/planos/atletas/${ATLETA_ID}/semanas`, (route) => route.fulfill(json([{
    id: 'plano-1', atletaId: ATLETA_ID, semanaInicio: '2026-11-02', semanaFim: '2026-11-08',
    volumePlanejadoKm: 40, volumeRealizadoKm: 15, volumeAlvoKm: 40, status: 'EM_ANDAMENTO',
    treinosPlanejados: [{
      id: 'tp-1', tipoTreino: 'LONGO', distanciaKm: 14, duracaoMin: 90, diaSemana: 'SABADO', dataTreino: '2026-11-07',
      zonaAlvo: 'Z3', ritmoAlvo: '6:00', percepcaoEsforcoEsperada: 6, statusTreino: 'REALIZADO',
      treinoRealizadoId: REALIZADO_ID, percepcaoEsforcoRealizado: rpe,
    }],
  }])))
  await page.goto('/#/coach/athletes')
  await expect(page.getByText(ATLETA_NOME)).toBeVisible()
  await page.locator('[data-field="actions"] button').first().click()
  await page.getByRole('menuitem', { name: 'Plano' }).click()
}

const dialog = (page: Page) => page.getByRole('dialog', { name: /execução/ })

test.describe('Coach — execução do treino realizado', () => {
  test('Planos → Ver realizado: comparativo, zonas, etapas e acordeão, com a análise do card', async ({ page }) => {
    const rotas: Rotas = { analise: ANALISE, chamadasAnalise: 0 }
    await mockarComum(page, rotas)
    await abrirPlanosPeloRoster(page, 7)

    await page.getByRole('button', { name: 'Ver realizado' }).click()
    const d = dialog(page)

    await expect(d.getByText('Saiu forte demais no início')).toBeVisible()
    await expect(d.getByText('Erro de Ritmo')).toBeVisible()
    await expect(d.getByRole('row', { name: /Distância.*14,00 km.*15,00 km.*\+1,00 km/ })).toBeVisible()
    await expect(d.getByRole('row', { name: /Zona.*77% no alvo/ })).toBeVisible()
    await expect(d.getByRole('img', { name: /Z3 77%/ })).toBeVisible()
    await expect(d.getByText('16 voltas')).toBeVisible()
    await expect(d.getByTestId('execucao-etapas-total')).toContainText('15,00 km')

    const acordeao = d.getByRole('button', { name: 'Todos os dados do relógio' })
    await expect(acordeao).toHaveAttribute('aria-expanded', 'false')
    await acordeao.click()
    await expect(d.getByText('Pernas pesadas no fim')).toBeVisible()
    await expect(d.getByText('22,0 °C (19–27 °C)')).toBeVisible()

    // O card já buscou a análise; o dialog reaproveita (CA3).
    expect(rotas.chamadasAnalise).toBe(1)
  })

  test('shell do coach → Ver realizado abre o mesmo dialog', async ({ page }) => {
    const rotas: Rotas = { analise: ANALISE, chamadasAnalise: 0 }
    await mockarComum(page, rotas)
    await page.route(`**/api/v1/coach/atletas/${ATLETA_ID}/revisao-semanal`, (route) => route.fulfill(json({}, 404)))
    await page.route(`**/api/v1/coach/atletas/${ATLETA_ID}/perfil`, (route) => route.fulfill(json({
      atletaId: ATLETA_ID, nomeAtleta: ATLETA_NOME, objetivo: null, proximaProva: null, nivelExperiencia: null,
      pmc: [], aderenciaSemanal: [], sinaisRecentes: [], sugestoesRecentes: [], recordes: [],
      geradoEm: new Date().toISOString(), avisos: null,
      planoVigente: {
        planoId: 'plano-1', semanaInicio: '2026-11-02', semanaFim: '2026-11-08', reviewStatus: 'APROVADO',
        treinos: [
          { id: 'tp-1', diaSemana: 'SABADO', tipoTreino: 'LONGO', distanciaKm: 14, statusExecucao: 'REALIZADO',
            duracaoMin: 'PT90M', zonaAlvo: 'Z3', ritmoAlvo: '6:00', percepcaoEsforcoEsperada: 6, treinoRealizadoId: REALIZADO_ID },
          { id: 'tp-2', diaSemana: 'DOMINGO', tipoTreino: 'FACIL', distanciaKm: 8, statusExecucao: 'PENDENTE' },
        ],
      },
    })))
    await page.goto(`/#/coach/athletes/${ATLETA_ID}`)

    await expect(page.getByRole('button', { name: 'Ver realizado' })).toHaveCount(1)
    await page.getByRole('button', { name: 'Ver realizado' }).click()

    const d = dialog(page)
    await expect(d.getByRole('row', { name: /Duração.*1:30:00.*1:33:33.*\+4 min/ })).toBeVisible()
    await expect(d.getByText('Saiu forte demais no início')).toBeVisible()
    expect(rotas.chamadasAnalise).toBe(1)
  })

  test('análise 204 com RPE: faixa de indisponível', async ({ page }) => {
    const rotas: Rotas = { analise: null, chamadasAnalise: 0 }
    await mockarComum(page, rotas)
    await abrirPlanosPeloRoster(page, 7)

    await page.getByRole('button', { name: 'Ver realizado' }).click()

    await expect(dialog(page).getByText('Análise da IA indisponível para este treino no momento')).toBeVisible()
    await expect(dialog(page).getByRole('row', { name: /Distância/ })).toBeVisible()
  })

  test('sem RPE: nota de dependência e nenhuma chamada de análise', async ({ page }) => {
    const rotas: Rotas = { analise: null, detalhe: { ...DETALHE, percepcaoEsforco: undefined }, chamadasAnalise: 0 }
    await mockarComum(page, rotas)
    await abrirPlanosPeloRoster(page, undefined)

    await page.getByRole('button', { name: 'Ver realizado' }).click()

    await expect(dialog(page).getByText('A análise da IA depende do RPE do atleta')).toBeVisible()
    expect(rotas.chamadasAnalise).toBe(0)
  })
})
