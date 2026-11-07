import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Edição de treino pendente em plano já aprovado — `coach-editar-treino-aprovado` (CA10, CA11, CA12, CA13).
 *
 * Decisão do treinador que escreve no plano do atleta e reenvia ao relógio: o RTL mocka o hook e não
 * vê o PATCH nem a releitura do perfil. Aqui rodam roteador e rede reais (só o backend é
 * interceptado): o PATCH sai no treino certo com o motivo, o perfil é relido e o card mostra o selo.
 */

const PERFIL_URL = '/#/coach/athletes/atleta-uuid'
const PLANO_ID = 'plano-uuid'

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

type Treino = Record<string, unknown>

/** Semana do plano fake (2026-11-02 a 2026-11-08). */
const DIA_POR_DATA: Record<string, string> = {
  '2026-11-02': 'SEGUNDA', '2026-11-03': 'TERCA', '2026-11-04': 'QUARTA', '2026-11-05': 'QUINTA',
  '2026-11-06': 'SEXTA', '2026-11-07': 'SABADO', '2026-11-08': 'DOMINGO',
}

function treino(id: string, diaSemana: string, over: Treino = {}): Treino {
  return {
    id, diaSemana, tipoTreino: 'CONTINUO', distanciaKm: 10, statusExecucao: 'PENDENTE', duracaoMin: 'PT60M',
    percepcaoEsforcoEsperada: 5, statusSincronizacao: 'SINCRONIZADO', atletaConectadoIntervalsIcu: false,
    channelConnected: true, syncInProgress: false, editable: true, ...over,
  }
}

/** Backend fake com estado: o PATCH grava o patch e marca o treino como editado após a aprovação. */
async function mockarApis(page: Page, estado: { treinos: Treino[]; patches: { url: string; body: Record<string, unknown> }[] }) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await autenticarComPkce(page, { roles: ['TECNICO'] })
  await page.route('**/api/**', (route) => route.fulfill(json({})))
  await page.route('**/api/v1/coach/atletas/atleta-uuid/revisao-semanal', (route) => route.fulfill(json({}, 404)))
  // O catch-all devolve {} e o dialog trataria isso como zonas válidas; 404 é o "sem zonas" real.
  await page.route('**/api/v1/coach/atletas/*/zonas', (route) => route.fulfill(json({}, 404)))
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json({
    id: 'coach-1', nome: 'Coach', email: 'coach@test.dev', roles: ['TECNICO'],
    assessoria: { id: 'tenant-uuid', nome: 'Assessoria Teste' }, lgpdConsentGranted: true,
    lgpdCurrentPolicyVersion: '2026-06-30', lgpdCurrentTermsVersion: '2026-06-30',
    lgpdAcceptedPolicyVersion: '2026-06-30', lgpdAcceptedTermsVersion: '2026-06-30',
    onboardingConcluido: true,
  })))
  await page.route('**/api/v1/coach/atletas/atleta-uuid/perfil', (route) => route.fulfill(json({
    atletaId: 'atleta-uuid', nomeAtleta: 'Marina Teste', objetivo: null, proximaProva: null,
    nivelExperiencia: null, pmc: [], aderenciaSemanal: [], sinaisRecentes: [], sugestoesRecentes: [],
    recordes: [], geradoEm: new Date().toISOString(), avisos: null,
    conexaoCanal: { plataforma: { value: 'GARMIN', label: 'Garmin' }, ativo: true, workoutImport: true, activityExport: true },
    planoVigente: {
      planoId: PLANO_ID, semanaInicio: '2026-11-02', semanaFim: '2026-11-08', reviewStatus: 'APROVADO',
      treinos: estado.treinos,
    },
  })))
  await page.route(`**/api/v1/coach/planos/${PLANO_ID}/treinos/*`, (route) => {
    if (route.request().method() !== 'PATCH') return route.fulfill(json({}))
    const body = route.request().postDataJSON() as Record<string, unknown>
    estado.patches.push({ url: route.request().url(), body })
    const id = route.request().url().split('/').pop()
    // Como o backend: a data nova deriva o dia, e a resposta devolve a data aplicada.
    const diaSemana = typeof body.dataTreino === 'string' ? DIA_POR_DATA[body.dataTreino] : undefined
    estado.treinos = estado.treinos.map((t) => t.id === id
      ? { ...t, ...body, ...(diaSemana ? { diaSemana } : {}), editedAfterApprovalAt: new Date().toISOString(), statusSincronizacao: 'AGUARDANDO_RETRY', syncInProgress: true }
      : t)
    return route.fulfill(json({ id, ...body }))
  })
}

test.describe('Coach — editar treino de plano aprovado', () => {
  test('edita treino pendente com motivo, o PATCH sai no treino certo e o card mostra o selo (CA13)', async ({ page }) => {
    const estado = {
      treinos: [
        treino('t1', 'SEGUNDA', { statusExecucao: 'REALIZADO', editable: false }),
        treino('t2', 'QUINTA'),
      ],
      patches: [] as { url: string; body: Record<string, unknown> }[],
    }
    await mockarApis(page, estado)
    await page.goto(PERFIL_URL)

    await expect(page.getByText('Aprovado', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /editar treino de qui/i }).click()

    await expect(page.getByText(/já está no Garmin Connect de Marina Teste/)).toBeVisible()
    const rpe = page.getByLabel(/esforço esperado/i)
    await rpe.fill('7')
    await page.getByRole('button', { name: 'Carga' }).click()
    await page.getByRole('button', { name: 'Salvar e reenviar' }).click()

    await expect.poll(() => estado.patches.length).toBe(1)
    expect(estado.patches[0].url).toContain(`/planos/${PLANO_ID}/treinos/t2`)
    expect(estado.patches[0].body).toMatchObject({ percepcaoEsforcoEsperada: 7, editReason: 'LOAD' })
    await expect(page.getByText(/atualizado\. Reenviando ao Garmin Connect/)).toBeVisible()
    await expect(page.getByText('Editado após aprovação')).toBeVisible()
  })

  test('treino realizado não tem lápis e mostra o cadeado (CA10)', async ({ page }) => {
    const estado = {
      treinos: [treino('t1', 'SEGUNDA', { statusExecucao: 'REALIZADO', editable: false })],
      patches: [] as { url: string; body: Record<string, unknown> }[],
    }
    await mockarApis(page, estado)
    await page.goto(PERFIL_URL)

    await expect(page.getByLabel('Treino realizado — não editável')).toBeVisible()
    await expect(page.getByRole('button', { name: /editar treino/i })).toHaveCount(0)
  })

  test('mover treino pendente para dia futuro: o PATCH leva dataTreino e o card muda de dia (coach-alterar-data-treino)', async ({ page }) => {
    const estado = { treinos: [treino('t2', 'QUINTA')], patches: [] as { url: string; body: Record<string, unknown> }[] }
    await mockarApis(page, estado)
    await page.goto(PERFIL_URL)

    await page.getByRole('button', { name: /editar treino de qui/i }).click()
    const dia = page.getByLabel('Dia do treino')
    await expect(dia).toHaveValue('2026-11-05')
    await dia.selectOption('2026-11-07')
    await page.getByRole('button', { name: 'Salvar e reenviar' }).click()

    await expect.poll(() => estado.patches.length).toBe(1)
    expect(estado.patches[0].body).toEqual({ dataTreino: '2026-11-07' })
    await expect(page.getByRole('button', { name: /editar treino de sáb/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /editar treino de qui/i })).toHaveCount(0)
  })

  test('destino no passado: o 422 do backend aparece no dialog, que continua aberto', async ({ page }) => {
    const estado = { treinos: [treino('t2', 'QUINTA')], patches: [] as { url: string; body: Record<string, unknown> }[] }
    await mockarApis(page, estado)
    await page.route(`**/api/v1/coach/planos/${PLANO_ID}/treinos/*`, (route) => route.fulfill(json(
      { status: 422, error: 'Unprocessable Entity', message: 'Nova data: treino de dia passado não pode ser editado.' }, 422)))
    await page.goto(PERFIL_URL)

    await page.getByRole('button', { name: /editar treino de qui/i }).click()
    await page.getByLabel('Dia do treino').selectOption('2026-11-02')
    await page.getByRole('button', { name: 'Salvar e reenviar' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Nova data: treino de dia passado' })).toBeVisible()
    await expect(page.getByLabel('Dia do treino')).toHaveValue('2026-11-02')
  })

  test('409 do backend: o dialog continua aberto com a mensagem e nada é relido', async ({ page }) => {
    const estado = { treinos: [treino('t2', 'QUINTA')], patches: [] as { url: string; body: Record<string, unknown> }[] }
    await mockarApis(page, estado)
    await page.route(`**/api/v1/coach/planos/${PLANO_ID}/treinos/*`, (route) => route.fulfill(json(
      { status: 409, error: 'Conflict', message: 'Envio ao relógio em andamento; tente em alguns segundos.' }, 409)))
    await page.goto(PERFIL_URL)

    await page.getByRole('button', { name: /editar treino de qui/i }).click()
    await page.getByLabel(/esforço esperado/i).fill('7')
    await page.getByRole('button', { name: 'Salvar e reenviar' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Envio ao relógio em andamento' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Salvar e reenviar' })).toBeVisible()
  })
})
