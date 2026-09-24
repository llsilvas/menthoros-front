import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Descanso prescrito na revisão do plano (show-descanso-no-plano).
 *
 * **Por que este arquivo existe.** Os testes de componente provam que o chip aparece e que o
 * callback recebe a data certa — mas mockam o diálogo e o salvamento. O que só aqui se prova é o
 * **corpo do POST** que chega na API depois de o treinador entrar por um dia de descanso: se a data
 * que sai for a errada, o backend cria o treino em outro dia e o descanso permanece, e nenhum teste
 * de unidade veria isso.
 */

const REVIEW_URL = '/#/coach/planos/revisao'
const ME_API = '**/api/v1/users/me**'
const REVIEW_API = '**/api/v1/coach/planos/revisao*'
const ADD_API = '**/api/v1/coach/planos/*/treinos'

const PLANO_ID = '11111111-1111-1111-1111-111111111111'
// Semana de 17/08 (segunda) a 23/08; quinta = 2026-08-20.
const QUINTA_ISO = '2026-08-20'
const MOTIVO = 'Readiness do dia é DESCANSAR, TSB -11,8 (limiar -25)'

const planoComDescanso = (restDays: Array<{ dayOfWeek: string; reason: string }>) => ({
  id: PLANO_ID,
  semanaInicio: '2026-08-17',
  semanaFim: '2026-08-23',
  volumePlanejadoKm: 20,
  volumeRealizadoKm: 0,
  volumeAlvoKm: 20,
  status: 'PLANEJADO',
  reviewStatus: 'AGUARDANDO_REVISAO',
  atletaNome: 'Atleta Teste',
  objetivoSemanal: 'Semana com carga reduzida',
  treinosPlanejados: [
    { id: 't-seg', diaSemana: 'SEGUNDA', tipoTreino: 'CONTINUO', distanciaKm: 8, duracaoMin: 'PT45M' },
  ],
  restDays,
})

async function mockarApis(page: Page, restDays = [{ dayOfWeek: 'QUINTA', reason: MOTIVO }]) {
  await page.route(ME_API, route =>
    route.fulfill({
      json: {
        id: 'coach-1', nome: 'Coach', email: 'coach@test.dev', roles: ['TECNICO'],
        assessoria: { id: 'tenant-uuid', nome: 'Assessoria Teste' },
        lgpdConsentGranted: true,
        lgpdCurrentPolicyVersion: '2026-06-30', lgpdCurrentTermsVersion: '2026-06-30',
        lgpdAcceptedPolicyVersion: '2026-06-30', lgpdAcceptedTermsVersion: '2026-06-30',
        onboardingConcluido: true,
      },
    }),
  )
  await page.route(REVIEW_API, route => {
    const status = new URL(route.request().url()).searchParams.get('status')
    route.fulfill({ json: status === 'AGUARDANDO_REVISAO' ? [planoComDescanso(restDays)] : [] })
  })
  await page.route('**/api/v1/coach/dashboard*', route => route.fulfill({ json: {} }))
}

test.describe('revisão do plano — descanso prescrito', () => {
  test('o POST leva a data do dia de descanso em que o treinador clicou', async ({ page }) => {
    await mockarApis(page)

    const posts: Array<Record<string, unknown>> = []
    await page.route(ADD_API, async route => {
      if (route.request().method() !== 'POST') return route.fallback()
      posts.push(route.request().postDataJSON())
      await route.fulfill({
        json: { id: 't-novo', diaSemana: 'QUINTA', tipoTreino: 'REGENERATIVO', dataTreino: QUINTA_ISO },
      })
    })

    await autenticarComPkce(page, { roles: ['TECNICO'] })
    await page.goto(REVIEW_URL)

    await page.getByRole('button', { name: /Atleta Teste/i }).click()

    // o motivo escrito para o treinador aparece como veio
    await expect(page.getByTestId('chip-descanso-QUINTA')).toContainText(MOTIVO)

    await page.getByTestId('acao-prescrever-QUINTA').click()

    // o diálogo abre já com a quinta selecionada — é o ponto que o teste de componente não prova
    await expect(page.getByLabel('Data do treino')).toHaveValue(QUINTA_ISO)

    await page.getByLabel('Tipo de treino').selectOption('REGENERATIVO')
    await page.getByRole('button', { name: 'Salvar treino' }).click()

    await expect.poll(() => posts.length).toBe(1)
    expect(posts[0].dataTreino, 'a data tem de ser a do dia de descanso clicado').toBe(QUINTA_ISO)
    expect(posts[0].tipoTreino).toBe('REGENERATIVO')
  })

  test('plano sem descanso não mostra chip nenhum', async ({ page }) => {
    await mockarApis(page, [])

    await autenticarComPkce(page, { roles: ['TECNICO'] })
    await page.goto(REVIEW_URL)
    await page.getByRole('button', { name: /Atleta Teste/i }).click()

    await expect(page.getByTestId('tag-treino-t-seg')).toBeVisible()
    await expect(page.getByTestId(/^chip-descanso-/)).toHaveCount(0)
  })
})
