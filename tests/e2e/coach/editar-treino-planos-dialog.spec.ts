import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'
import { MOCK_ATLETAS } from '../../fixtures/mocks'

/**
 * Edição de treino de plano aprovado pelo PlanosDialog — `editar-treino-aprovado-planos-dialog`.
 *
 * O RTL mocka o hook da lista e o PATCH; aqui rodam roteador, rede e o reload reais (só o backend é
 * interceptado): o lápis abre o editor, o PATCH sai no plano/treino certos com o motivo, a lista é
 * relida e o card mostra o selo. O JSON da listagem segue o contrato da change (`editable`,
 * `editRejection`, `editedAfterApprovalAt` no treino; `conexaoCanal` no plano).
 */

const ATLETAS_URL = '/#/atletas'
const PLANO_ID = 'plano-uuid'

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

type Treino = Record<string, unknown>
type Plano = Record<string, unknown>

function treino(id: string, diaSemana: string, dataTreino: string, over: Treino = {}): Treino {
  return {
    id,
    diaSemana: { value: diaSemana, label: diaSemana },
    dataTreino,
    tipoTreino: { value: 'CONTINUO', label: 'Contínuo' },
    distanciaKm: 10,
    duracaoMin: '01:00:00',
    percepcaoEsforcoEsperada: 5,
    observacao: 'Ritmo confortável',
    statusTreino: { value: 'PENDENTE', label: 'Pendente' },
    editable: true,
    ...over,
  }
}

function plano(treinos: Treino[], over: Plano = {}): Plano {
  return {
    id: PLANO_ID, atletaId: 'atleta-1-uuid', semanaInicio: '2026-11-02', semanaFim: '2026-11-08',
    status: 'ATIVO', volumePlanejadoKm: 20, volumeRealizadoKm: 0, volumeAlvoKm: 20,
    conexaoCanal: { plataforma: { value: 'GARMIN', label: 'Garmin' }, ativo: true, workoutImport: true, activityExport: true },
    treinosPlanejados: treinos,
    ...over,
  }
}

type Patch = { url: string; body: Record<string, unknown> }

/** Backend fake com estado: o PATCH grava o patch e marca o treino como editado após a aprovação. */
async function mockarApis(page: Page, estado: { planos: Plano[]; patches: Patch[] }) {
  await page.setViewportSize({ width: 1440, height: 900 })
  // Papel padrão da fixture (ADMIN), como em gerar-plano-async: é o que chega à lista legada de
  // `/#/atletas`, uma das telas que montam o PlanosDialog.
  await autenticarComPkce(page)
  await page.route('**/api/**', (route) => route.fulfill(json({})))
  await page.route('**/api/v1/atletas**', (route) => route.fulfill(json(MOCK_ATLETAS)))
  // O catch-all devolve {} e o editor trataria isso como zonas válidas; 404 é o "sem zonas" real.
  await page.route('**/api/v1/coach/atletas/*/zonas', (route) => route.fulfill(json({}, 404)))
  await page.route('**/api/v1/planos/atletas/atleta-1-uuid/semanas', (route) => route.fulfill(json(estado.planos)))
  await page.route(`**/api/v1/coach/planos/${PLANO_ID}/treinos/*`, (route) => {
    if (route.request().method() !== 'PATCH') return route.fulfill(json({}))
    const body = route.request().postDataJSON() as Record<string, unknown>
    estado.patches.push({ url: route.request().url(), body })
    const id = route.request().url().split('/').pop()
    estado.planos = estado.planos.map((p) => ({
      ...p,
      treinosPlanejados: (p.treinosPlanejados as Treino[]).map((t) => t.id === id
        ? { ...t, percepcaoEsforcoEsperada: body.percepcaoEsforcoEsperada, editedAfterApprovalAt: new Date().toISOString() }
        : t),
    }))
    return route.fulfill(json({ id }))
  })
}

async function abrirPlanos(page: Page) {
  await page.goto(ATLETAS_URL)
  await expect(page.getByText('Ana Corredora')).toBeVisible()
  await page.getByLabel(/planos de ana corredora/i).click()
}

test.describe('Coach — editar treino de plano aprovado pelo PlanosDialog', () => {
  test('edita treino pendente de atleta com Garmin: PATCH no treino certo com motivo, lista relida com o selo', async ({ page }) => {
    const estado = {
      planos: [plano([treino('t2', 'QUINTA', '2026-11-05')])],
      patches: [] as Patch[],
    }
    await mockarApis(page, estado)
    await abrirPlanos(page)

    await page.getByRole('button', { name: /editar treino de qui/i }).click()
    await expect(page.getByText(/já está no Garmin Connect de Ana Corredora/)).toBeVisible()
    await page.getByLabel(/esforço esperado/i).fill('7')
    await page.getByRole('button', { name: 'Carga' }).click()
    await page.getByRole('button', { name: 'Salvar e reenviar' }).click()

    await expect.poll(() => estado.patches.length).toBe(1)
    expect(estado.patches[0].url).toContain(`/planos/${PLANO_ID}/treinos/t2`)
    expect(estado.patches[0].body).toMatchObject({ percepcaoEsforcoEsperada: 7, editReason: 'LOAD' })
    expect(estado.patches[0].body).not.toHaveProperty('duracaoMin')
    expect(estado.patches[0].body).not.toHaveProperty('observacao')
    await expect(page.getByRole('button', { name: 'Salvar e reenviar' })).toHaveCount(0)
    await expect(page.getByText('Editado após aprovação')).toBeVisible()
  })

  test('treino de dia passado mostra o cadeado e não tem lápis', async ({ page }) => {
    const estado = {
      planos: [plano([treino('t1', 'SEGUNDA', '2026-11-02', { editable: false, editRejection: 'PAST_DAY' })])],
      patches: [] as Patch[],
    }
    await mockarApis(page, estado)
    await abrirPlanos(page)

    await expect(page.getByLabel('Treino de dia passado — não editável')).toBeVisible()
    await expect(page.getByRole('button', { name: /editar treino/i })).toHaveCount(0)
  })

  test('plano concluído mostra o selo do treino editado, sem lápis nem cadeado', async ({ page }) => {
    const estado = {
      planos: [plano(
        [treino('t1', 'QUINTA', '2026-10-29', { editable: undefined, editedAfterApprovalAt: '2026-10-28T12:00:00Z' })],
        { status: 'CONCLUIDO', semanaInicio: '2026-10-26', semanaFim: '2026-11-01' },
      )],
      patches: [] as Patch[],
    }
    await mockarApis(page, estado)
    await abrirPlanos(page)

    await expect(page.getByText('Editado após aprovação')).toBeVisible()
    await expect(page.getByRole('button', { name: /editar treino/i })).toHaveCount(0)
    await expect(page.getByLabel(/não editável|já está no relógio/)).toHaveCount(0)
  })
})
