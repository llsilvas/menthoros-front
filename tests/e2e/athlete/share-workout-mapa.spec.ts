import { readFileSync } from 'node:fs'
import { test, expect, type Page, type Request } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Cards com mapa — gate da change `athlete-share-cards-mapa`.
 *
 * Fluxo crítico de consentimento LGPD (trajeto GPS é dado sensível). O que só aqui se prova, com o
 * router, a rasterização e o download reais: treino com GPS abre na Rota; sem consentimento o Salvar
 * abre o aviso em vez de baixar; ao confirmar, a versão apresentada vai ao servidor e o PNG sai em
 * 1080×1920; o card Foto aceita uma imagem do aparelho e baixa o PNG; sem GPS não há Rota nem Foto.
 */

const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: true, assessoria: { id: 'a1', nome: 'Pace Forte' } }
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })
// Polyline de referência do Google (três pontos).
const TRACE = { v: 1, n: 3, polyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', tSeg: [0, 600, 1200], fc: [140, 150, null] }
// PNG 1×1 válido: o input de arquivo aceita imagem, e o Chromium decodifica com createImageBitmap.
const FOTO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

function hojeIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function mockar(page: Page, { temTrajeto, granted }: { temTrajeto: boolean; granted: boolean }) {
  const chamadasConsent: Request[] = []
  let concedido = granted
  await page.route('**/api/**', (route) => {
    const objeto = /\/me\/home|\/me\/readiness|\/onboarding|\/calibracao|intervals-icu|\/checkins\//.test(route.request().url())
    route.fulfill({ status: 200, contentType: 'application/json', body: objeto ? '{}' : '[]' })
  })
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json(ME)))
  await page.route('**/api/v1/planos/atleta-uuid**', (route) => route.fulfill({ status: 404 }))
  await page.route('**/api/v1/atletas/me/treinos**', (route) => route.fulfill(json([{
    id: 'tr1', dataTreino: hojeIso(), tipoTreino: 'CONTINUO', duracaoMin: '1:05:12', distanciaKm: 14.2, fcMedia: 148,
    fonteDados: { value: 'GARMIN', label: 'Garmin' }, deviceName: 'Forerunner 265',
    status: { value: 'REALIZADO', label: 'Realizado' }, temTrajeto,
  }])))
  await page.route('**/api/v1/atletas/me/realizados/tr1/trajeto', (route) => route.fulfill(json(TRACE)))
  await page.route('**/api/v1/atletas/me/consentimentos/trajeto-compartilhamento', (route) => {
    const req = route.request()
    chamadasConsent.push(req)
    if (req.method() === 'POST') concedido = true
    route.fulfill(json({ granted: concedido, policyVersion: '2026-11-09' }, req.method() === 'POST' ? 201 : 200))
  })
  return chamadasConsent
}

function dimensoesPng(caminho: string) {
  const b = readFileSync(caminho)
  expect(b.subarray(1, 4).toString('ascii')).toBe('PNG')
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('Atleta — cards com mapa', () => {
  test('sem consentimento o Salvar abre o aviso; confirmar libera o PNG da Rota em 1080×1920', async ({ page }, testInfo) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    const chamadas = await mockar(page, { temTrajeto: true, granted: false })
    await page.goto('/#/athlete/share/tr1')

    await expect(page.getByRole('radio', { name: 'Rota' })).toBeChecked()
    const salvar = page.getByRole('button', { name: 'Salvar' })
    await expect(salvar).toBeEnabled()

    // Sem consentimento: abre o aviso e não baixa nada.
    let baixou = false
    page.on('download', () => { baixou = true })
    await salvar.click()
    const aviso = page.getByRole('dialog', { name: 'Seu trajeto vai aparecer na imagem' })
    await expect(aviso).toContainText('incluindo onde você começou e terminou')
    expect(baixou).toBe(false)

    await aviso.getByRole('button', { name: 'Entendi, compartilhar' }).click()
    await expect(aviso).toBeHidden()
    expect(chamadas.find((r) => r.method() === 'POST')?.postDataJSON()).toEqual({ policyVersion: '2026-11-09' })

    await expect(salvar).toBeEnabled({ timeout: 20_000 })
    const [download] = await Promise.all([page.waitForEvent('download'), salvar.click()])
    expect(download.suggestedFilename()).toBe('menthoros-rota-story.png')
    expect(dimensoesPng(await download.path())).toEqual({ w: 1080, h: 1920 })
    await download.saveAs(testInfo.outputPath(download.suggestedFilename()))
  })

  test('"Usar modelo sem mapa" troca o modelo e nada é concedido', async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    const chamadas = await mockar(page, { temTrajeto: true, granted: false })
    await page.goto('/#/athlete/share/tr1')

    await page.getByRole('button', { name: 'Salvar' }).click()
    await page.getByRole('button', { name: 'Usar modelo sem mapa' }).click()

    await expect(page.getByRole('radio', { name: 'Semana' })).toBeChecked()
    expect(chamadas.some((r) => r.method() === 'POST')).toBe(false)
  })

  test('Foto: imagem do aparelho vira PNG com os adesivos', async ({ page }, testInfo) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockar(page, { temTrajeto: true, granted: true })
    await page.goto('/#/athlete/share/tr1')

    await page.getByRole('radio', { name: 'Foto' }).click()
    await expect(page.getByRole('button', { name: 'Salvar' })).toBeDisabled()
    await page.getByTestId('input-foto').setInputFiles({ name: 'corrida.png', mimeType: 'image/png', buffer: FOTO })
    await expect(page.getByRole('button', { name: /Adesivo distância/ })).toBeVisible()

    const salvar = page.getByRole('button', { name: 'Salvar' })
    await expect(salvar).toBeEnabled({ timeout: 20_000 })
    const [download] = await Promise.all([page.waitForEvent('download'), salvar.click()])
    expect(dimensoesPng(await download.path())).toEqual({ w: 1080, h: 1920 })
    await download.saveAs(testInfo.outputPath(download.suggestedFilename()))
  })

  test('treino sem GPS não lista Rota nem Foto', async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockar(page, { temTrajeto: false, granted: false })
    await page.goto('/#/athlete/share/tr1')

    await expect(page.getByRole('radio', { name: 'Semana' })).toBeChecked()
    await expect(page.getByRole('radio', { name: 'Rota' })).toHaveCount(0)
    await expect(page.getByRole('radio', { name: 'Foto' })).toHaveCount(0)
  })
})
