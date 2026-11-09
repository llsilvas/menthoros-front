import { readFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Compartilhar treino — gate da change `athlete-share-cards`.
 *
 * O que só aqui se prova: a entrada pelo drawer do Plano chega à tela certa pelo hash router; o
 * card renderiza com dados no formato real da API (inclusive o plano vindo como objeto único);
 * trocar modelo/formato/assinatura muda o card; e o Salvar baixa um PNG rasterizado de verdade,
 * com as dimensões do formato (360 px × pixelRatio 3).
 */

const PLAN_URL = '/#/athlete/plan'

const ME = {
  id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com',
  lgpdConsentGranted: true, onboardingConcluido: true,
  assessoria: { id: 'ass-1', nome: 'Assessoria Pace Forte' },
}

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

function semanaCorrente() {
  const hoje = new Date()
  const dow = (hoje.getDay() + 6) % 7
  const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dow)
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const dia = (i: number) => iso(new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + i))
  return { inicio: dia(0), fim: dia(6), dia, hojeIdx: dow }
}

function realizado(fonte: 'GARMIN' | 'MANUAL', dataTreino: string) {
  return {
    id: 'tr1', dataTreino, tipoTreino: 'INTERVALADO', duracaoMin: '50:38', distanciaKm: 10.4, fcMedia: 158,
    fonteDados: { value: fonte, label: fonte === 'GARMIN' ? 'Garmin' : 'Manual' },
    deviceName: fonte === 'GARMIN' ? 'Forerunner 265' : null,
    status: { value: 'REALIZADO', label: 'Realizado' },
    etapasRealizadas: [
      { ordem: 1, paceMedia: '4:22', distanciaKm: 0.8 },
      { ordem: 2, paceMedia: '4:19', distanciaKm: 0.8 },
      { ordem: 3, paceMedia: '4:14', distanciaKm: 0.8 },
    ],
  }
}

async function mockar(page: Page, fonte: 'GARMIN' | 'MANUAL') {
  const s = semanaCorrente()
  const hoje = s.dia(s.hojeIdx)
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    const objeto = /\/me\/home|\/me\/readiness|\/onboarding|\/calibracao|intervals-icu|\/checkins\//.test(url)
    route.fulfill({ status: 200, contentType: 'application/json', body: objeto ? '{}' : '[]' })
  })
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json(ME)))
  await page.route('**/api/v1/atletas/me/realizados/tr1/analise**', (route) => route.fulfill({ status: 204 }))
  await page.route('**/api/v1/atletas/me/treinos**', (route) => route.fulfill(json([realizado(fonte, hoje)])))
  // Objeto único, não lista — o backend responde assim e a tela de compartilhar tem de aguentar.
  await page.route('**/api/v1/planos/atleta-uuid**', (route) => route.fulfill(json({
    id: 'p1', atletaId: 'atleta-uuid', semanaInicio: s.inicio, semanaFim: s.fim,
    volumePlanejadoKm: 42, volumeRealizadoKm: 10.4, volumeAlvoKm: 42, status: 'ATIVO',
    treinosPlanejados: [{
      tipoTreino: 'INTERVALADO', distanciaKm: 10, dataTreino: hoje, descricao: '6 × 800 m',
      duracaoMin: '00:55:00', statusTreino: 'REALIZADO', diaSemana: 'X', treinoRealizadoId: 'tr1',
      etapas: [
        { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 12 },
        { ordem: 2, tipoEtapa: 'ESFORCO', distanciaKm: 0.8, repeticoes: 6 },
      ],
    }],
  })))
}

/** Largura × altura lidas do cabeçalho IHDR do PNG. */
function dimensoesPng(caminho: string) {
  const b = readFileSync(caminho)
  expect(b.subarray(1, 4).toString('ascii')).toBe('PNG')
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}

async function abrirCompartilhar(page: Page) {
  await page.goto(PLAN_URL)
  await page.locator('[data-testid="week-agenda-row"]', { hasText: 'Intervalado' }).getByRole('button').first().click()
  await page.getByRole('dialog').getByRole('link', { name: 'Compartilhar' }).click()
  await expect(page).toHaveURL(/#\/athlete\/share\/tr1$/)
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('Atleta — compartilhar treino', () => {
  test('drawer → Compartilhar → trocar modelo, formato e assinatura → Salvar baixa o PNG no tamanho do formato', async ({ page }, testInfo) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockar(page, 'GARMIN')
    await abrirCompartilhar(page)

    const card = page.getByRole('img', { name: /^Card / })
    await expect(card).toHaveAttribute('data-format', 'story')
    await expect(card).toContainText('GARMIN FORERUNNER 265')
    await expect(page.getByTestId('share-signature')).toContainText('Assessoria Pace Forte')

    await page.getByRole('radio', { name: 'Semana' }).click()
    await expect(card).toHaveAttribute('data-format', 'quadrado')
    await page.getByRole('radio', { name: 'Feed' }).click()
    await expect(card).toHaveAttribute('data-format', 'feed')

    await page.getByRole('switch', { name: 'Mostrar assessoria' }).click()
    await expect(page.getByTestId('share-signature')).toHaveCount(0)

    const salvar = page.getByRole('button', { name: 'Salvar' })
    await expect(salvar).toBeEnabled({ timeout: 20_000 })
    const [download] = await Promise.all([page.waitForEvent('download'), salvar.click()])
    expect(download.suggestedFilename()).toBe('menthoros-semana-feed.png')
    expect(dimensoesPng(await download.path())).toEqual({ w: 1080, h: 1350 })
    // Guarda o PNG em test-results para inspeção visual (fontes, cortes) — o tamanho não prova a aparência.
    await download.saveAs(testInfo.outputPath(download.suggestedFilename()))
  })

  test('treino manual: card sem atribuição Garmin', async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockar(page, 'MANUAL')
    await abrirCompartilhar(page)

    await expect(page.getByRole('img', { name: /^Card / })).toBeVisible()
    await expect(page.getByTestId('garmin-attribution')).toHaveCount(0)
  })
})
