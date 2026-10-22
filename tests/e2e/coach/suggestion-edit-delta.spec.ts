import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Edição do texto da sugestão com delta — `add-coach-suggestion-edit-delta`.
 *
 * Decisão do coach que escreve no que chega ao atleta (coach-in-the-loop), então o fluxo precisa
 * rodar no navegador de verdade: o RTL mocka `SugestaoService` e não vê a query `versaoEsperada`
 * nem o body do `PUT` que a rede leva. O que só aqui se prova: a versão lida é a que o backend
 * recebe, e o 409 de aba desatualizada vira mensagem + texto atual, não um erro mudo.
 */

const PERFIL_URL = '/#/coach/athletes/atleta-uuid'
const ORIGINAL = 'Reduzir volume em 20%'
const EDITADO = 'Reduzir volume em 20% nas próximas duas semanas'

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

function sugestao(over: Record<string, unknown> = {}) {
  return {
    id: 's1', atletaId: 'atleta-uuid', athleteName: 'Marina Teste', tipo: 'PLAN_ADJUST',
    status: 'PENDING', confidence: 'HIGH', summary: ORIGINAL, createdAt: '2026-10-20T10:00:00Z',
    editadoPeloCoach: false, versao: 0, ...over,
  }
}

/** Backend fake com estado: `PUT`/`POST` registram o que a rede levou, para asserção. */
async function mockarApis(page: Page, estado: { atual: Record<string, unknown>; puts: unknown[]; aprovarUrls: string[] }) {
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
    nivelExperiencia: null, pmc: [], aderenciaSemanal: [], planoVigente: null, sinaisRecentes: [],
    sugestoesRecentes: [{ id: 's1', tipo: 'AJUSTE_PLANO', status: estado.atual.status, criadoEm: '2026-10-20T10:00:00Z' }],
    recordes: [], geradoEm: new Date().toISOString(), avisos: null,
  })))
  await page.route('**/api/v1/coach/sugestoes/s1**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (req.method() === 'PUT') {
      const body = req.postDataJSON()
      estado.puts.push(body)
      if (body.versaoEsperada !== estado.atual.versao) return route.fulfill(json({ message: 'conflito' }, 409))
      estado.atual = {
        ...estado.atual, summary: body.summary, summaryOriginal: estado.atual.summaryOriginal ?? estado.atual.summary,
        editadoPeloCoach: true, versao: (estado.atual.versao as number) + 1,
      }
      return route.fulfill(json(estado.atual))
    }
    if (req.method() === 'POST' && url.pathname.endsWith('/aprovar')) {
      estado.aprovarUrls.push(req.url())
      estado.atual = { ...estado.atual, status: 'APPROVED', versao: (estado.atual.versao as number) + 1 }
      return route.fulfill(json(estado.atual))
    }
    return route.fulfill(json(estado.atual))
  })
}

async function abrirSugestao(page: Page) {
  await page.goto(PERFIL_URL)
  await page.getByRole('button', { name: /^ver$/i }).click()
  return page.getByRole('dialog')
}

test.describe('Coach — editar sugestão e ver o delta', () => {
  test('edita, vê original e editado, e aprova enviando a versão nova', async ({ page }) => {
    const estado = { atual: sugestao(), puts: [] as unknown[], aprovarUrls: [] as string[] }
    await mockarApis(page, estado)
    const dialog = await abrirSugestao(page)

    await dialog.getByRole('button', { name: /^editar$/i }).click()
    await dialog.getByLabel('Texto da sugestão').fill(EDITADO)
    await dialog.getByRole('button', { name: /^salvar$/i }).click()

    await expect(dialog.getByText('Sugestão original da IA')).toBeVisible()
    await expect(dialog.getByText('Editado por você')).toBeVisible()
    expect(estado.puts).toEqual([{ summary: EDITADO, versaoEsperada: 0 }])

    await dialog.getByRole('button', { name: /aprovar/i }).click()
    await expect(dialog.getByText('Aprovada').first()).toBeVisible()
    expect(new URL(estado.aprovarUrls[0]).searchParams.get('versaoEsperada')).toBe('1')
  })

  test('aba desatualizada: 409 mostra o aviso e o texto que o outro coach salvou', async ({ page }) => {
    const estado = { atual: sugestao(), puts: [] as unknown[], aprovarUrls: [] as string[] }
    await mockarApis(page, estado)
    const dialog = await abrirSugestao(page)
    await dialog.getByRole('button', { name: /^editar$/i }).click()

    // Outro coach edita depois que esta aba leu a versão 0.
    estado.atual = sugestao({ summary: 'Texto do outro coach', summaryOriginal: ORIGINAL, editadoPeloCoach: true, versao: 1 })
    await dialog.getByLabel('Texto da sugestão').fill(EDITADO)
    await dialog.getByRole('button', { name: /^salvar$/i }).click()

    await expect(dialog.getByText(/mudou desde que você abriu/i)).toBeVisible()
    await expect(dialog.getByText(/Texto do outro coach/).first()).toBeVisible()
    await expect(dialog.getByLabel('Texto da sugestão')).toHaveCount(0)
  })

  test('sugestão já decidida não oferece Editar', async ({ page }) => {
    const estado = { atual: sugestao({ status: 'APPROVED' }), puts: [] as unknown[], aprovarUrls: [] as string[] }
    await mockarApis(page, estado)
    const dialog = await abrirSugestao(page)

    await expect(dialog.getByText('Aprovada').first()).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^editar$/i })).toHaveCount(0)
  })
})
