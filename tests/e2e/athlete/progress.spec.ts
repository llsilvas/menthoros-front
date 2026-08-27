import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Progresso do atleta — gate da change `athlete-progress-questions`.
 *
 * O que só aqui se prova: quatro blocos no fluxo, sem abas; a leitura descreve e nunca julga;
 * o gráfico completo expande inline (mesmo componente); nenhum texto do shell em Syne nem fora
 * da escala — com a varredura limitada ao que está fora do gráfico expandido (Recharts tem
 * fontes próprias).
 */

const URL = '/#/athlete/progress'
const ESCALA_PX = [11, 13, 14, 16, 18, 24, 32]

const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: true }
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

function isoDiasAtras(dias: number) {
  const d = new Date(); d.setDate(d.getDate() - dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function segundaDaSemanaCorrente() {
  const h = new Date(); const dow = (h.getDay() + 6) % 7
  const seg = new Date(h.getFullYear(), h.getMonth(), h.getDate() - dow)
  return `${seg.getFullYear()}-${String(seg.getMonth() + 1).padStart(2, '0')}-${String(seg.getDate()).padStart(2, '0')}`
}

async function mockarProgresso(page: Page) {
  const pmc = Array.from({ length: 85 }, (_, i) => {
    const dias = 84 - i
    return { data: isoDiasAtras(dias), ctl: 30 + (84 - dias) * 0.25, atl: 28, tsb: 2, tss: 40, statusForma: 'FORMA_IDEAL' }
  })
  await page.route('**/api/**', (r) => r.fulfill(json([])))
  await page.route('**/api/v1/users/me**', (r) => r.fulfill(json(ME)))
  await page.route('**/api/v1/atletas/me/metricas/historico**', (r) => r.fulfill(json(pmc)))
  await page.route('**/api/v1/atletas/me/metricas/zonas**', (r) => r.fulfill(json({ z1: 12, z2: 62, z3: 10, z4: 13, z5: 3, duracaoTotalSegundos: 100 })))
  await page.route('**/api/v1/atletas/me/aderencia**', (r) => r.fulfill(json([{ semanaInicio: segundaDaSemanaCorrente(), totalPlanejado: 4, totalRealizado: 3, percentual: 75 }])))
  await page.route('**/api/v1/atletas/me/recordes**', (r) => r.fulfill(json([{ distancia: '5 km', tempoSegundos: 1471, data: isoDiasAtras(10), treinoRealizadoId: 't1' }])))
  await page.route('**/api/v1/atletas/me/provas**', (r) => r.fulfill(json([])))
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('Atleta — Progresso', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockarProgresso(page)
    await page.goto(URL)
    await page.getByTestId('progress-stronger').waitFor()
  })

  test('quatro blocos no fluxo, sem abas, sem jargão, leitura que descreve e "Falar com o coach" em cada um', async ({ page }) => {
    await expect(page.getByRole('tab')).toHaveCount(0)
    for (const id of ['progress-stronger', 'progress-zones', 'progress-adherence', 'progress-records']) {
      await expect(page.getByTestId(id)).toBeVisible()
    }
    await expect(page.getByRole('link', { name: /falar com o coach/i })).toHaveCount(4)
    // CTL 30 → 51 em 84 dias (0,25/dia): D−28 = 44, hoje = 51 → +7; valor exato para pegar erro de limiar/arredondamento
    await expect(page.getByTestId('progress-stronger-reading')).toHaveText('Sua carga subiu +7')
    await expect(page.getByText(/^(Sim|Não)$/)).toHaveCount(0)
    await expect(page.getByText(/\b(CTL|ATL|TSB)\b|\bpts\b/)).toHaveCount(0)
    await expect(page.getByText(/Z2 — 62%/)).toBeVisible()
    await expect(page.getByTestId('progress-adherence-count')).toContainText('3 de 4')
    await expect(page.locator('[data-testid="progress-record-row"][data-new="true"]')).toHaveCount(1)
    const estoura = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(estoura).toBe(false)
  })

  test('"Ver o gráfico completo" expande o PMC inline, sem drawer, e o link do coach continua visível', async ({ page }) => {
    await page.getByRole('button', { name: /ver o gráfico completo/i }).click()
    const expandido = page.getByTestId('progress-pmc-expanded')
    await expect(expandido).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByTestId('progress-stronger').getByRole('link', { name: /falar com o coach/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /fechar o gráfico/i })).toHaveAttribute('aria-expanded', 'true')
  })

  test('nenhum texto do shell em Syne nem fora da escala (fora do gráfico expandido)', async ({ page }) => {
    await page.getByRole('button', { name: /ver o gráfico completo/i }).click()
    await page.getByTestId('progress-pmc-expanded').waitFor()
    const fora = await page.evaluate((escala) => {
      const problemas: Array<{ texto: string; familia: string; px: number }> = []
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        if (el.closest('[data-testid="progress-pmc-expanded"]')) continue // Recharts tem fontes próprias
        if (el.closest('[data-testid="progress-sparkline"]')) continue // rótulos mono da sparkline (11px)
        const proprio = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent?.trim() ?? '').join('')
        if (!proprio) continue
        const estilo = getComputedStyle(el)
        if (estilo.visibility === 'hidden' || estilo.display === 'none') continue
        const px = Math.round(Number.parseFloat(estilo.fontSize) * 100) / 100
        const familia = estilo.fontFamily
        if (/syne/i.test(familia.split(',')[0]) || !escala.includes(px)) problemas.push({ texto: proprio.slice(0, 40), familia: familia.split(',')[0], px })
      }
      return problemas
    }, ESCALA_PX)
    expect(fora, `fora do sistema: ${JSON.stringify(fora)}`).toEqual([])
  })
})
