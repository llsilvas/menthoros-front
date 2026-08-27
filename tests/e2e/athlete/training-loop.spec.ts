import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Ciclo do treino do atleta — parte A (modo treino) da change `athlete-training-loop`.
 *
 * O que só aqui se prova: perfil + três etapas + "Concluí o treino" cabem sem scroll em
 * 390×844 (CA2); o botão abre o registro pré-preenchido com o tipo do treino (CA3); "Não vou
 * conseguir hoje" marca o dia PERDIDO e isso aparece no Plano (CA4).
 */

const URL = '/#/athlete/workout/today'
const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: true }
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

function hojeIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TREINO_HOJE = {
  hoje: hojeIso(),
  id: 'treino-1',
  tipoTreino: 'INTERVALADO',
  descricao: '6 × 800 m',
  duracaoMin: 50,
  zonaAlvo: 'Z4',
  statusTreino: 'PENDENTE',
  etapas: [
    { ordem: 1, tipoEtapa: 'AQUECIMENTO', descricao: 'Trote', duracaoMin: 10, alvoPrimario: 'NENHUM' },
    { ordem: 2, tipoEtapa: 'INTERVALADO', descricao: 'Tiro', duracaoMin: 4, alvoPrimario: 'FC', fcAlvoMin: 158, fcAlvoMax: 165, blocoId: 'b1', blocoRepeticoes: 2 },
    { ordem: 3, tipoEtapa: 'RECUPERACAO', descricao: 'Trote leve', duracaoMin: 2, alvoPrimario: 'NENHUM', blocoId: 'b1', blocoRepeticoes: 2 },
  ],
}

async function mockarBase(page: Page) {
  // Coringa por último-registrado-primeiro-avaliado: endpoints de objeto (home, readiness,
  // calibração) recebem `{}`; o resto — sobretudo listas como `/me/treinos` do formulário
  // manual — recebe `[]`, senão um `.map` num objeto derruba a página silenciosamente.
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    const objeto = /\/me\/home|\/me\/readiness|\/onboarding|\/calibracao|intervals-icu|\/checkins\//.test(url)
    route.fulfill({ status: 200, contentType: 'application/json', body: objeto ? '{}' : '[]' })
  })
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json(ME)))
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('Atleta — Ciclo do treino (modo treino)', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockarBase(page)
  })

  test('perfil, três etapas e "Concluí o treino" cabem sem scroll; concluir abre o registro pré-preenchido', async ({ page }) => {
    await page.route('**/api/v1/atletas/me/treinos/hoje', (route) => route.fulfill(json(TREINO_HOJE)))
    await page.goto(URL)

    await expect(page.getByTestId('workout-profile')).toBeVisible()
    const etapas = page.getByTestId('workout-today-etapa')
    await expect(etapas).toHaveCount(3)
    const acoes = page.getByTestId('workout-today-actions')
    const concluir = page.getByRole('button', { name: /concluí o treino/i })
    await expect(concluir).toBeVisible()

    // Sem scroll: as ações cabem dentro da viewport de 844px (CA2).
    const box = await acoes.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y + box!.height).toBeLessThanOrEqual(844)

    await concluir.click()
    await expect(page).toHaveURL(/#\/athlete\/training\/log/)
    const chipIntervalado = page.getByText('Intervalado', { exact: true }).locator('xpath=ancestor::*[@role="radio"]')
    await expect(chipIntervalado).toHaveAttribute('aria-checked', 'true')
    // Duração é o primeiro campo numérico do formulário (Distância vem depois).
    await expect(page.locator('input[type="number"]').first()).toHaveValue('50')
  })

  test('"Não vou conseguir hoje" marca o dia como pulado — aparece no Plano no mesmo dia', async ({ page }) => {
    await page.route('**/api/v1/atletas/me/treinos/hoje/pular', (route) =>
      route.fulfill(json({ ...TREINO_HOJE, statusTreino: 'PERDIDO', motivoPulo: 'DOR', puladoEm: `${TREINO_HOJE.hoje}T19:00:00` })))
    let pulado = false
    await page.route('**/api/v1/atletas/me/treinos/hoje', (route) =>
      route.fulfill(json(pulado ? { ...TREINO_HOJE, statusTreino: 'PERDIDO', motivoPulo: 'DOR' } : TREINO_HOJE)))
    await page.goto(URL)

    await page.getByRole('button', { name: /não vou conseguir hoje/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('radio', { name: /^dor$/i }).click()
    pulado = true
    await page.getByRole('button', { name: /confirmar/i }).click()

    await expect(page.getByText(/você pulou hoje/i)).toBeVisible()
    await expect(page.getByText(/dor/i)).toBeVisible()

    // O Plano, consultado no mesmo dia, também mostra o pulo (PERDIDO → status "pulado",
    // mapeamento existente de `dayStatus.ts`, reaproveitado sem mudança nesta change).
    const plano = {
      id: 'p1', atletaId: 'atleta-uuid', semanaInicio: TREINO_HOJE.hoje, semanaFim: TREINO_HOJE.hoje,
      volumePlanejadoKm: 8, volumeRealizadoKm: 0, volumeAlvoKm: 8, status: 'ATIVO', objetivoSemanal: 'Semana de base',
      treinosPlanejados: [
        { tipoTreino: 'INTERVALADO', distanciaKm: 8, dataTreino: TREINO_HOJE.hoje, descricao: '6 × 800 m',
          duracaoMin: '00:50:00', statusTreino: 'PERDIDO', diaSemana: 'X' },
      ],
    }
    await page.route('**/api/v1/planos/atleta-uuid**', (route) => route.fulfill(json(plano)))
    await page.goto('/#/athlete/plan')
    const hoje = page.locator('[data-testid="week-agenda-row"][data-today="true"]')
    await expect(hoje).toHaveAttribute('data-status', 'pulado')
  })
})
