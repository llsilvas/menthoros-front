import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Home do atleta — gate da change `athlete-home-restructure`.
 *
 * O que só aqui se prova (o `CLAUDE.md` do front é explícito: check-in e registro são fluxos
 * críticos, e a suíte unitária concorda com o código porque o mesmo autor escreveu os dois):
 * o botão de registro visível sem scroll num telefone; o check-in inline enviando o DTO
 * completo e a prontidão nova vindo do GET (não de estado otimista); um Alert só em falha
 * parcial; a barra com cinco alvos; e nenhum texto do shell em Syne ou fora da escala.
 */

const HOME_URL = '/#/athlete/home'
const ESCALA_PX = [11, 13, 14, 16, 18, 24, 32]

const ME = {
  id: 'user-uuid',
  atletaId: 'atleta-uuid',
  nome: 'Marina Teste',
  email: 'marina@teste.com',
  avatarUrl: null,
  assessoria: { id: 'tenant-uuid', nome: 'Corridas Serra' },
  lgpdConsentGranted: true,
  onboardingConcluido: true,
}

const CHECKIN_SALVO = {
  id: 'checkin-uuid', atletaId: 'atleta-uuid', data: new Date().toISOString().slice(0, 10),
  qualidadeSono: 3, humor: 3, doresMusculares: 8, nivelEnergia: 3, estresse: 8,
  readinessScore: 0.21, nivelProntidao: 'DESCANSAR',
}

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

interface Opcoes {
  kudosStatus?: number
  provasStatus?: number
}

/** Home com dados mínimos e reais de contrato; a prontidão muda depois do POST do check-in. */
async function mockarHome(page: Page, opcoes: Opcoes = {}) {
  let checkinFeito = false

  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json(ME)))
  await page.route('**/api/v1/atletas/me/home', (route) =>
    route.fulfill(json({
      proximoTreino: { data: CHECKIN_SALVO.data, tipoTreino: 'FACIL', descricao: '45 min em Z2, terreno plano' },
      metricasChave: { ctl: 48, atl: 40, tsb: 8, tss: 52, statusForma: 'FORMA_IDEAL' },
    })),
  )
  await page.route('**/api/v1/atletas/me/readiness', (route) =>
    route.fulfill(json({ score: checkinFeito ? 21 : 78, classificacao: checkinFeito ? 'DESCANSAR' : 'PRONTO', nota: 'Mantenha o plano.' })),
  )
  await page.route('**/api/v1/checkins/atleta-uuid/atual', (route) =>
    route.fulfill(checkinFeito ? json(CHECKIN_SALVO) : { status: 204, body: '' }),
  )
  await page.route('**/api/v1/checkins', (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    checkinFeito = true
    return route.fulfill(json(CHECKIN_SALVO, 201))
  })
  await page.route('**/api/v1/atletas/me/treinos**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/atletas/me/provas**', (route) =>
    route.fulfill(opcoes.provasStatus ? json({ message: 'erro' }, opcoes.provasStatus) : json([])),
  )
  await page.route('**/api/v1/atletas/me/kudos/recentes**', (route) =>
    route.fulfill(opcoes.kudosStatus ? json({ message: 'erro' }, opcoes.kudosStatus) : json([])),
  )
  await page.route('**/api/v1/planos/atleta-uuid**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/atletas/atleta-uuid/calibracao**', (route) => route.fulfill({ status: 204, body: '' }))
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('Atleta — Home', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
  })

  test('"Registrar treino" é a única ação sólida e fica visível sem scroll em 390×844', async ({ page }) => {
    await mockarHome(page)
    await page.goto(HOME_URL)

    const registrar = page.getByRole('button', { name: /registrar treino/i })
    await expect(registrar).toBeVisible()
    const caixa = await registrar.boundingBox()
    expect(caixa).not.toBeNull()
    expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(844)

    const solidos = await page.locator('button.MuiButton-contained').count()
    expect(solidos).toBe(1)

    await expect(page.getByRole('button', { name: /iniciar treino|editado hoje/i })).toHaveCount(0)
    await expect(page.getByText(/\b(CTL|ATL|TSB)\b|\bpts\b/)).toHaveCount(0)
  })

  test('check-in inline: nada é enviado até o quinto item; o POST leva os cinco campos e a prontidão vem do GET', async ({ page }) => {
    await mockarHome(page)
    await page.goto(HOME_URL)

    await expect(page.getByText(/prontidão alta/i)).toBeVisible()
    await page.getByRole('button', { name: /fazer check-in/i }).click()
    await expect(page.getByText('Como você acordou?')).toBeVisible()

    const posts: string[] = []
    page.on('request', (r) => {
      if (r.method() === 'POST' && r.url().includes('/api/v1/checkins')) posts.push(r.postData() ?? '')
    })

    for (const nome of ['Sono', 'Humor', 'Dores', 'Energia']) {
      await page.getByRole('button', { name: nome, exact: true }).click()
    }
    await expect(page.getByText('4 de 5')).toBeVisible()
    expect(posts).toHaveLength(0)

    const readinessDepois = page.waitForResponse((r) => r.url().includes('/atletas/me/readiness') && r.request().method() === 'GET')
    await page.getByRole('button', { name: 'Estresse', exact: true }).click()
    await readinessDepois

    expect(posts).toHaveLength(1)
    expect(JSON.parse(posts[0])).toEqual({ qualidadeSono: 3, humor: 3, doresMusculares: 8, nivelEnergia: 3, estresse: 8 })

    // O score novo é o que o GET devolveu depois do POST — não o valor otimista.
    await expect(page.getByText(/prontidão baixa/i)).toBeVisible()
    await expect(page.getByText('Salvo')).toBeVisible()
    await expect(page.getByText(/com base no seu check-in/i)).toBeVisible()

    // Check-in existente: um toque envia o DTO completo de novo (segundo POST), sem passar pelo modal.
    await page.getByRole('button', { name: 'Humor', exact: true }).click()
    await expect.poll(() => posts.length).toBe(2)
    expect(JSON.parse(posts[1])).toEqual({ qualidadeSono: 3, humor: 6, doresMusculares: 8, nivelEnergia: 3, estresse: 8 })
  })

  test('falha parcial (provas e kudos) vira um único Alert com Recarregar', async ({ page }) => {
    await mockarHome(page, { kudosStatus: 500, provasStatus: 500 })
    await page.goto(HOME_URL)

    await expect(page.getByRole('button', { name: /registrar treino/i })).toBeVisible()
    const alertas = page.getByRole('alert')
    await expect(alertas).toHaveCount(1)
    await expect(alertas.first()).toContainText(/alguns dados não carregaram/i)
    await expect(alertas.first()).toContainText(/próxima prova/i)
    await expect(alertas.first()).toContainText(/reconhecimentos do coach/i)
    await expect(page.getByRole('button', { name: /recarregar/i })).toBeVisible()
    await expect(page.getByText(/peça ao seu coach/i)).toHaveCount(0)
  })

  test('barra inferior tem cinco destinos; "Sair" vive no Perfil com confirmação', async ({ page }) => {
    await mockarHome(page)
    await page.route('**/api/v1/atletas/me/intervals-icu**', (route) => route.fulfill(json({ conectado: false })))
    await page.goto(HOME_URL)

    const nav = page.getByRole('navigation', { name: /navegação do atleta/i })
    await expect(nav.getByRole('button')).toHaveCount(5)
    await expect(nav.getByRole('button', { name: 'Sair' })).toHaveCount(0)

    await nav.getByRole('button', { name: 'Perfil' }).click()
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('dialog')).toContainText(/sair da conta/i)
  })

  test('nenhum texto do shell em Syne nem fora da escala de tipografia', async ({ page }) => {
    await mockarHome(page)
    await page.goto(HOME_URL)
    await expect(page.getByRole('button', { name: /registrar treino/i })).toBeVisible()

    const fora = await page.evaluate((escala) => {
      const problemas: Array<{ texto: string; familia: string; px: number }> = []
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const proprio = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent?.trim() ?? '')
          .join('')
        if (!proprio) continue
        const estilo = getComputedStyle(el)
        if (estilo.visibility === 'hidden' || estilo.display === 'none') continue
        const px = Math.round(Number.parseFloat(estilo.fontSize) * 100) / 100
        const familia = estilo.fontFamily
        if (/syne/i.test(familia.split(',')[0]) || !escala.includes(px)) {
          problemas.push({ texto: proprio.slice(0, 40), familia: familia.split(',')[0], px })
        }
      }
      return problemas
    }, ESCALA_PX)

    expect(fora, `fora do sistema: ${JSON.stringify(fora)}`).toEqual([])
  })
})
