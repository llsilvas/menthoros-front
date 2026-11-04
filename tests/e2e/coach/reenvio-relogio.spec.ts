import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Reenvio do plano ao relógio — `garmin-reenvio-plano` (CA7, CA10, CA11).
 *
 * Fluxo que escreve no envio ao relógio de um atleta real: o RTL mocka o hook e não vê o POST que a
 * rede leva nem a releitura do perfil. Aqui rodam roteador e rede reais (só o backend é interceptado):
 * o clique sai como POST no plano certo, a tela relê o perfil e o chip reflete o novo estado.
 */

const PERFIL_URL = '/#/coach/athletes/atleta-uuid'
const PLANO_ID = 'plano-uuid'

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

type Treino = Record<string, unknown>

function treino(id: string, diaSemana: string, over: Treino = {}): Treino {
  return {
    id, diaSemana, tipoTreino: 'FACIL', distanciaKm: 8, statusExecucao: 'PENDENTE', duracaoMin: 'PT45M',
    statusSincronizacao: 'SINCRONIZADO', atletaConectadoIntervalsIcu: false, channelConnected: true,
    syncInProgress: false, ...over,
  }
}

/** Backend fake com estado: o POST de reenvio move o treino em erro para AGUARDANDO_RETRY. */
async function mockarApis(page: Page, estado: { treinos: Treino[]; posts: string[] }) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await autenticarComPkce(page, { roles: ['TECNICO'] })
  await page.route('**/api/**', (route) => route.fulfill(json({})))
  await page.route('**/api/v1/coach/atletas/atleta-uuid/revisao-semanal', (route) => route.fulfill(json({}, 404)))
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
    planoVigente: {
      planoId: PLANO_ID, semanaInicio: '2026-11-02', semanaFim: '2026-11-08', reviewStatus: 'APROVADO',
      treinos: estado.treinos,
    },
  })))
  await page.route(`**/api/v1/coach/planos/${PLANO_ID}/reenviar-sincronizacao`, (route) => {
    estado.posts.push(route.request().method())
    const emErro = estado.treinos.filter((t) => String(t.statusSincronizacao).startsWith('ERRO_'))
    estado.treinos = estado.treinos.map((t) => String(t.statusSincronizacao).startsWith('ERRO_')
      ? { ...t, statusSincronizacao: 'AGUARDANDO_RETRY', syncInProgress: true }
      : t)
    return route.fulfill(json({ resent: emErro.length }))
  })
}

const botao = (page: Page) => page.getByRole('button', { name: /reenviar ao relógio/i })

test.describe('Coach — reenviar o plano ao relógio', () => {
  test('treino em erro: clica, o POST sai no plano e o card volta a "Envio pendente"', async ({ page }) => {
    const estado = {
      treinos: [treino('t1', 'SEGUNDA', { statusSincronizacao: 'ERRO_PERMANENTE' }), treino('t2', 'QUARTA')],
      posts: [] as string[],
    }
    await mockarApis(page, estado)
    await page.goto(PERFIL_URL)

    await expect(page.getByText('Erro no envio')).toBeVisible()
    await botao(page).click()

    await expect.poll(() => estado.posts).toEqual(['POST'])
    await expect(page.getByText(/Reenvio solicitado/)).toBeVisible()
    await expect(page.getByText('Erro no envio')).toHaveCount(0)
    await expect(page.getByText('Envio pendente')).toBeVisible()
  })

  test('sem treino em erro o botão não aparece', async ({ page }) => {
    const estado = { treinos: [treino('t1', 'SEGUNDA')], posts: [] as string[] }
    await mockarApis(page, estado)
    await page.goto(PERFIL_URL)

    await expect(page.getByText('No relógio')).toBeVisible()
    await expect(botao(page)).toHaveCount(0)
  })

  test('atleta sem canal: botão desabilitado e nenhuma chamada', async ({ page }) => {
    const estado = {
      treinos: [treino('t1', 'SEGUNDA', { statusSincronizacao: 'ERRO_PERMANENTE', channelConnected: false })],
      posts: [] as string[],
    }
    await mockarApis(page, estado)
    await page.goto(PERFIL_URL)

    await expect(botao(page)).toBeDisabled()
    expect(estado.posts).toEqual([])
  })
})
