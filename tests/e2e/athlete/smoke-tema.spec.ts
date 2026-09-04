import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Smoke do tema do shell (task 6.2 de `athlete-home-restructure`): as telas que a change NÃO
 * redesenhou herdam a fonte nova pelo `ThemeProvider` do `AthleteLayout`. O que se verifica é o
 * critério objetivo de "estouro" do proposal — scroll horizontal e texto em Syne — e um screenshot
 * por tela para inspeção. Dados: respostas vazias; o alvo é o layout, não o conteúdo.
 */

const TELAS = [
  { nome: 'home', url: '/#/athlete/home' },
  { nome: 'progresso', url: '/#/athlete/progress' },
  { nome: 'coach', url: '/#/athlete/coach' },
  { nome: 'perfil', url: '/#/athlete/profile' },
  { nome: 'registro', url: '/#/athlete/training/log' },
  { nome: 'plano', url: '/#/athlete/plan' },
]

const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: true }

async function mockarVazio(page: Page) {
  await page.route('**/api/v1/users/me**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ME) }))
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    // Objetos só onde o contrato devolve um objeto; o resto é lista vazia.
    const objeto = /\/me\/home|\/me\/readiness|\/onboarding|\/calibracao|intervals-icu|\/checkins\//.test(url)
    route.fulfill({ status: 200, contentType: 'application/json', body: objeto ? '{}' : '[]' })
  })
}

test.use({ viewport: { width: 390, height: 844 } })

for (const tela of TELAS) {
  test(`smoke ${tela.nome}: sem scroll horizontal e sem Syne em 390px`, async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockarVazio(page)
    await page.goto(tela.url)
    await page.getByRole('navigation', { name: /navegação do atleta/i }).waitFor()
    await page.waitForTimeout(800)

    await page.screenshot({ path: `test-results/smoke-${tela.nome}.png`, fullPage: true })

    const estoura = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(estoura, 'scroll horizontal').toBe(false)

    const emSyne = await page.evaluate(() => {
      const achados: string[] = []
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const texto = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent?.trim() ?? '').join('')
        if (!texto) continue
        const estilo = getComputedStyle(el)
        if (estilo.display === 'none' || estilo.visibility === 'hidden') continue
        if (/syne/i.test(estilo.fontFamily.split(',')[0])) achados.push(texto.slice(0, 40))
      }
      return achados
    })
    expect(emSyne, `textos em Syne: ${JSON.stringify(emSyne)}`).toEqual([])
  })
}
