import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Plano do atleta — gate da change `athlete-plan-agenda`.
 *
 * O que só aqui se prova: a semana inteira cabe em 390px sem scroll horizontal; hoje começa
 * expandido e o registro navega; o toque num treino com etapas abre o detalhe com o perfil do
 * treino (o mesmo componente do coach); num treino sem etapas, expande; o rodapé não julga.
 */

const PLAN_URL = '/#/athlete/plan'

const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: true }

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

/** Semana corrente (segunda→domingo) no fuso do runner, em ISO local. */
function semanaCorrente() {
  const hoje = new Date()
  const dow = (hoje.getDay() + 6) % 7 // 0 = segunda
  const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dow)
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const dia = (i: number) => iso(new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + i))
  return { inicio: dia(0), fim: dia(6), dia, hojeIdx: dow }
}

async function mockarPlano(page: Page) {
  const s = semanaCorrente()
  // Hoje: intervalado com etapas (abre o detalhe). Outro dia: longo sem etapas (expande).
  const outro = s.hojeIdx === 5 ? 3 : 5
  const plano = {
    id: 'p1', atletaId: 'atleta-uuid', semanaInicio: s.inicio, semanaFim: s.fim,
    volumePlanejadoKm: 42, volumeRealizadoKm: 14.5, volumeAlvoKm: 42, status: 'ATIVO', objetivoSemanal: 'Semana de base',
    treinosPlanejados: [
      { tipoTreino: 'INTERVALADO', distanciaKm: 8, dataTreino: s.dia(s.hojeIdx), descricao: '6 × 800 m', duracaoMin: '00:50:00', statusTreino: 'PENDENTE', diaSemana: 'X',
        etapas: [
          { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10, descricaoEtapa: 'Trote' },
          { ordem: 2, tipoEtapa: 'ESFORCO', duracaoMin: 4, blocoId: 'b1', blocoRepeticoes: 2 },
          { ordem: 3, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
          { ordem: 4, tipoEtapa: 'ESFORCO', duracaoMin: 4, blocoId: 'b1', blocoRepeticoes: 2 },
          { ordem: 5, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
        ] },
      { tipoTreino: 'LONGO', distanciaKm: 15, dataTreino: s.dia(outro), descricao: 'Longo em Z2', duracaoMin: '01:30:00', statusTreino: 'PENDENTE', diaSemana: 'Y' },
    ],
  }
  // O Playwright avalia as rotas da ÚLTIMA registrada para a primeira: o coringa vai antes, e os
  // específicos depois, senão o coringa engole o plano e a tela mostra "ainda não aprovou".
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    const objeto = /\/me\/home|\/me\/readiness|\/onboarding|\/calibracao|intervals-icu|\/checkins\//.test(url)
    route.fulfill({ status: 200, contentType: 'application/json', body: objeto ? '{}' : '[]' })
  })
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json(ME)))
  await page.route('**/api/v1/planos/atleta-uuid**', (route) => route.fulfill(json(plano)))
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('Atleta — Plano da semana', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockarPlano(page)
    await page.goto(PLAN_URL)
    await page.getByTestId('week-agenda').waitFor()
  })

  test('sete linhas no fluxo vertical, sem scroll horizontal, rodapé neutro e sem TSS', async ({ page }) => {
    await expect(page.getByTestId('week-agenda-row')).toHaveCount(7)
    await page.screenshot({ path: 'test-results/smoke-plano-agenda.png', fullPage: true })
    const estoura = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth
      || Array.from(document.querySelectorAll('[data-testid="week-agenda"]')).some((el) => el.scrollWidth > el.clientWidth))
    expect(estoura).toBe(false)

    const volume = page.getByTestId('plan-volume')
    await expect(volume).toContainText('14,5')
    await expect(volume).toContainText('/ 42 km')
    await expect(volume).toContainText(/Dia \d de 7/)
    await expect(volume).toContainText(/0 de 2 treinos feitos/)
    await expect(page.getByText(/TSS|semana leve|abaixo do planejado|ótima execução/i)).toHaveCount(0)
  })

  test('hoje está destacado; toque no treino com etapas abre o detalhe com o perfil e a série 2×; registrar navega', async ({ page }) => {
    const hoje = page.locator('[data-testid="week-agenda-row"][data-today="true"]')
    await expect(hoje).toHaveCount(1)
    await expect(hoje).toContainText(/intervalado/i)

    await hoje.getByRole('button').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByTestId('workout-profile')).toBeVisible()
    await expect(dialog.getByTestId('repeat-bracket')).toContainText('2×')

    await dialog.getByRole('button', { name: /registrar treino/i }).click()
    await expect(page).toHaveURL(/#\/athlete\/training\/log/)
  })

  test('treino sem etapas expande e colapsa na própria linha', async ({ page }) => {
    const longo = page.locator('[data-testid="week-agenda-row"]', { hasText: 'Longo' })
    const botao = longo.getByRole('button')
    await expect(botao).toHaveAttribute('aria-expanded', 'false')
    await botao.click()
    await expect(botao).toHaveAttribute('aria-expanded', 'true')
    await expect(longo).toContainText('Longo em Z2')
    await botao.click()
    await expect(botao).toHaveAttribute('aria-expanded', 'false')
  })
})
