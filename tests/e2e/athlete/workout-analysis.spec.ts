import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Análise da IA para o atleta — gate da change `analise-ia-treino-atleta`.
 *
 * O que só aqui se prova: a agenda sinaliza "Análise pronta" a partir do flag do contrato; o
 * drawer do treino concluído mostra chip + card com os quatro blocos vindos do endpoint do
 * atleta; PENDING mostra "Analisando…"; 204 não deixa card nem promessa; e o registro manual
 * com RPE termina no card em PENDING no lugar da frase fixa.
 */

const PLAN_URL = '/#/athlete/plan'
const LOG_URL = '/#/athlete/training/log'

const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: true }

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

const ANALISE_COMPLETA = {
  status: 'COMPLETED',
  analyzedAt: '2026-08-30T12:00:00Z',
  reconhecimento: 'Você segurou o ritmo nos dois blocos de tempo.',
  comoFoi: 'Saiu como planejado: 58 min contra 61 previstos.',
  esforco: 'Um 7 num treino previsto como 6 — pesou um pouco mais que o esperado.',
  proximoTreino: 'Capriche no sono hoje e vale comentar com seu coach como você acorda amanhã.',
  executado: { duracaoMin: 58, distanciaKm: 11.2, rpe: 7 },
  planejado: { duracaoMin: 61, distanciaKm: 11.0, rpeEsperado: 6 },
}

/** Semana corrente (segunda→domingo) no fuso do runner, em ISO local. */
function semanaCorrente() {
  const hoje = new Date()
  const dow = (hoje.getDay() + 6) % 7 // 0 = segunda
  const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dow)
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const dia = (i: number) => iso(new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + i))
  return { inicio: dia(0), fim: dia(6), dia, hojeIdx: dow }
}

async function mockarBase(page: Page) {
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    const objeto = /\/me\/home|\/me\/readiness|\/onboarding|\/calibracao|intervals-icu|\/checkins\//.test(url)
    route.fulfill({ status: 200, contentType: 'application/json', body: objeto ? '{}' : '[]' })
  })
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json(ME)))
}

async function mockarPlanoComConcluido(page: Page) {
  const s = semanaCorrente()
  // O concluído fica em qualquer dia ≠ hoje para a linha não ganhar o CTA de registrar.
  const idxConcluido = s.hojeIdx === 0 ? 1 : 0
  const plano = {
    id: 'p1', atletaId: 'atleta-uuid', semanaInicio: s.inicio, semanaFim: s.fim,
    volumePlanejadoKm: 42, volumeRealizadoKm: 11.2, volumeAlvoKm: 42, status: 'ATIVO',
    treinosPlanejados: [
      {
        tipoTreino: 'CONTINUO', distanciaKm: 11, dataTreino: s.dia(idxConcluido), descricao: 'Dois blocos de tempo',
        duracaoMin: '01:01:00', statusTreino: 'REALIZADO', diaSemana: 'X',
        treinoRealizadoId: 'tr1', percepcaoEsforcoRealizado: 7, analiseAtletaDisponivel: true,
        etapas: [
          { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 15, descricaoEtapa: 'Trote' },
          { ordem: 2, tipoEtapa: 'ESFORCO', duracaoMin: 15 },
        ],
      },
    ],
  }
  await page.route('**/api/v1/planos/atleta-uuid**', (route) => route.fulfill(json(plano)))
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('Atleta — análise do treino no Plano', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockarBase(page)
    await mockarPlanoComConcluido(page)
  })

  test('agenda sinaliza "Análise pronta"; drawer mostra chip e os quatro blocos', async ({ page }) => {
    await page.route('**/api/v1/atletas/me/realizados/tr1/analise**', (route) => route.fulfill(json(ANALISE_COMPLETA)))
    await page.goto(PLAN_URL)

    const linha = page.locator('[data-testid="week-agenda-row"]', { hasText: 'Análise pronta' })
    await expect(linha).toHaveCount(1)

    await linha.getByRole('button').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Concluído')).toBeVisible()
    await expect(dialog.getByText('RPE 7/10 · Difícil')).toBeVisible()

    const card = dialog.getByTestId('workout-analysis-card')
    await expect(card).toBeVisible()
    await expect(card).toContainText('Você segurou o ritmo nos dois blocos de tempo.')
    await expect(card).toContainText('Como foi')
    await expect(card).toContainText('O que o seu esforço diz')
    await expect(card).toContainText('Para o próximo treino')
    await expect(card).toContainText('plano 61 min')
    await expect(card).toContainText('Seu coach vê a mesma análise')
    // Nada do vocabulário do coach vaza para o atleta.
    await expect(dialog.getByText(/TSB|CTL|ATL|score/i)).toHaveCount(0)
  })

  test('análise em andamento: card em "Analisando…" com os números', async ({ page }) => {
    await page.route('**/api/v1/atletas/me/realizados/tr1/analise**', (route) =>
      route.fulfill(json({ status: 'PENDING', executado: { duracaoMin: 58, distanciaKm: 11.2, rpe: 7 } })))
    await page.goto(PLAN_URL)

    await page.locator('[data-testid="week-agenda-row"]', { hasText: 'Análise pronta' }).getByRole('button').click()
    const card = page.getByRole('dialog').getByTestId('workout-analysis-card')
    await expect(card).toContainText('Analisando o seu treino…')
    await expect(card).toContainText('58 min')
    await expect(card).not.toContainText('Como foi')
  })

  test('sem análise (204): drawer sem card e sem promessa', async ({ page }) => {
    await page.route('**/api/v1/atletas/me/realizados/tr1/analise**', (route) =>
      route.fulfill({ status: 204, body: '' }))
    await page.goto(PLAN_URL)

    const linha = page.locator('[data-testid="week-agenda-row"]').first()
    await linha.getByRole('button').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Concluído')).toBeVisible()
    await expect(dialog.getByTestId('workout-analysis-card')).toHaveCount(0)
    await expect(dialog.getByText('Dois blocos de tempo')).toBeVisible()
  })
})

test.describe('Atleta — registro manual termina no card em PENDING', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockarBase(page)
  })

  test('registrar com RPE mostra "Analisando…" no lugar da frase fixa', async ({ page }) => {
    await page.route('**/api/v1/atletas/me/treinos', (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      route.fulfill(json({
        id: 'tr-novo', dataTreino: '2026-08-30', tipoTreino: 'CONTINUO', duracaoMin: '00:50:00',
        distanciaKm: 10, percepcaoEsforco: 6, tssCalculado: 55,
        fonteDados: { value: 'MANUAL', label: 'Manual' }, status: { value: 'CONCLUIDO', label: 'Concluído' },
      }))
    })
    await page.route('**/api/v1/atletas/me/realizados/tr-novo/analise**', (route) =>
      route.fulfill(json({ status: 'PENDING', executado: { duracaoMin: 50, distanciaKm: 10, rpe: 6 } })))

    await page.goto(LOG_URL)
    await page.getByRole('radio', { name: 'Corrida contínua' }).click()
    await page.getByLabel('Duração (minutos)').fill('50')
    await page.getByRole('button', { name: /registrar treino/i }).click()

    const card = page.getByTestId('workout-analysis-card')
    await expect(card).toBeVisible()
    await expect(card).toContainText('Analisando o seu treino…')
    await expect(card).toContainText('a análise fica guardada aqui no treino')
    await expect(page.getByText('Bom treino! Mantenha a consistência.')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /voltar para home/i })).toBeVisible()
  })
})
