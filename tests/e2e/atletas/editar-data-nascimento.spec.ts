import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * E2E da change fix-atleta-edit-data-nascimento (entrada de dados que alimenta o motor).
 *
 * O defeito: `GET /api/v1/atletas/{id}` devolvia só `idade`, então a edição abria o campo
 * "Data de Nascimento" vazio e o treinador precisava redigitar a data só para salvar. O unit do
 * dialog passa mesmo sem a correção (ele já lia o campo); só o browser com o contrato real mostra
 * o fluxo inteiro: abrir a edição, ver a data, alterar o objetivo e o PUT sair com a data original.
 */

const ATLETA_ID = 'atleta-e2e-1'
const ATLETA_NOME = 'Bruno Dias'
const DATA_NASCIMENTO = '1993-05-15'

const ATLETAS_URL = '/#/coach/athletes'
const ME_API = '**/api/v1/users/me**'
const ROSTER_API = '**/api/v1/coach/atletas'
const QUEUE_API = '**/api/v1/coach/attention-queue'
const REVIEW_API = '**/api/v1/coach/planos/revisao*'
const ATLETA_API = `**/api/v1/atletas/${ATLETA_ID}`

function atletaCadastrado(extra: Record<string, unknown> = {}) {
  return {
    id: ATLETA_ID,
    nome: ATLETA_NOME,
    idade: 32,
    dataNascimento: DATA_NASCIMENTO,
    pesoKg: 70,
    alturaCm: 175,
    objetivo: 'Correr 10K',
    nivelExperiencia: 'INTERMEDIARIO',
    diasDisponiveis: ['SEGUNDA', 'QUARTA'],
    diaPreferidoLongo: 'QUARTA',
    temLesao: false,
    provas: [],
    email: 'bruno@teste.dev',
    sexo: 'MASCULINO',
    ...extra,
  }
}

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
    route.fulfill({ json: [{ atletaId: ATLETA_ID, nome: ATLETA_NOME, status: 'active', weeklyVolume: 48 }] }),
  )
}

async function abrirEdicao(page: Page) {
  await page.goto(ATLETAS_URL)
  await page.setViewportSize({ width: 1600, height: 900 })
  await expect(page.getByText(ATLETA_NOME)).toBeVisible()
  await page.locator('[data-field="actions"] button').first().click()
  await page.getByRole('menuitem', { name: 'Editar' }).click()
}

test.describe('Atleta — edição com data de nascimento', () => {
  test.beforeEach(async ({ page }) => {
    await mockarShell(page)
    await autenticarComPkce(page, { roles: ['TECNICO'] })
  })

  test('abre com a data carregada e salva sem redigitá-la', async ({ page }) => {
    let corpoPut: Record<string, unknown> | null = null
    await page.route(ATLETA_API, async (route) => {
      if (route.request().method() === 'PUT') {
        corpoPut = route.request().postDataJSON()
        await route.fulfill({ json: atletaCadastrado({ objetivo: 'Meia maratona' }) })
        return
      }
      await route.fulfill({ json: atletaCadastrado() })
    })

    await abrirEdicao(page)

    await expect(page.getByLabel('Data de nascimento *')).toHaveValue(DATA_NASCIMENTO)

    const objetivo = page.getByLabel('Objetivo *')
    await objetivo.fill('Meia maratona')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()

    await expect.poll(() => corpoPut).not.toBeNull()
    expect(corpoPut).toMatchObject({ dataNascimento: DATA_NASCIMENTO, objetivo: 'Meia maratona' })
    await expect(page.getByText('Data de nascimento é obrigatória')).toHaveCount(0)
  })

  test('atleta legado sem data abre vazio e exige o preenchimento', async ({ page }) => {
    let putFeito = false
    await page.route(ATLETA_API, async (route) => {
      if (route.request().method() === 'PUT') {
        putFeito = true
        await route.fulfill({ json: atletaCadastrado() })
        return
      }
      await route.fulfill({ json: atletaCadastrado({ dataNascimento: undefined }) })
    })

    await abrirEdicao(page)

    await expect(page.getByLabel('Data de nascimento *')).toHaveValue('')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()

    await expect(page.getByText('Data de nascimento é obrigatória')).toBeVisible()
    expect(putFeito).toBe(false)
  })

  test('cadastro novo pelos chips e selects, peso com vírgula, e o atleta aparece na lista', async ({ page }) => {
    let corpoPost: Record<string, unknown> | null = null
    let cadastrado = false
    await page.route(ROSTER_API, (route) =>
      route.fulfill({
        json: cadastrado
          ? [{ atletaId: 'atleta-novo', nome: 'Carla Souza', status: 'active', weeklyVolume: 0 }]
          : [],
      }),
    )
    await page.route('**/api/v1/atletas', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      corpoPost = route.request().postDataJSON()
      cadastrado = true
      await route.fulfill({ status: 201, json: atletaCadastrado({ id: 'atleta-novo', nome: 'Carla Souza' }) })
    })

    await page.goto(ATLETAS_URL)
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click()

    await page.getByLabel('Nome').fill('Carla Souza')
    await page.getByLabel('Data de nascimento').fill('1993-05-15')
    await page.getByLabel('Sexo').click()
    await page.getByRole('option', { name: 'Feminino' }).click()
    await page.getByLabel('Peso').fill('72,5')
    await page.getByLabel('Altura').fill('168')
    await page.getByLabel('Objetivo').fill('Correr 10K')
    await page.getByLabel('Nível de experiência').click()
    await page.getByRole('option', { name: 'Intermediário' }).click()
    await page.getByRole('button', { name: 'Terça' }).click()
    await page.getByRole('button', { name: 'Sábado' }).click()
    await page.getByLabel('Dia do treino longo').click()
    await page.getByRole('option', { name: 'Sábado' }).click()

    await page.getByRole('button', { name: 'Adicionar atleta' }).click()

    await expect.poll(() => corpoPost).not.toBeNull()
    expect(corpoPost).toMatchObject({
      nome: 'Carla Souza',
      dataNascimento: '1993-05-15',
      sexo: 'FEMININO',
      pesoKg: 72.5,
      alturaCm: 168,
      nivelExperiencia: 'INTERMEDIARIO',
      diaPreferidoLongo: 'SABADO',
    })
    expect((corpoPost as unknown as { diasDisponiveis: string[] }).diasDisponiveis.sort()).toEqual(['SABADO', 'TERCA'])
    await expect(page.getByText('Carla Souza')).toBeVisible()
  })
})
