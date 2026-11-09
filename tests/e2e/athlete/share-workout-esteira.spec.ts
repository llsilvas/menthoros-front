import { readFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Card Esteira — gate da change `athlete-share-cards-esteira` (CA5, CA7).
 *
 * O que só aqui se prova, com o router, a rasterização e o download reais: treino com
 * `esteira: true` e sem trajeto lista "Esteira" e "Foto" (sem Rota), escolher Esteira baixa um PNG
 * story de 1080×1920, e a Foto na esteira não consulta o consentimento de trajeto.
 */

const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: true, assessoria: { id: 'a1', nome: 'Pace Forte' } }
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })
const FOTO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

function hojeIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function mockar(page: Page, esteira: boolean) {
  let consultouConsentimento = false
  await page.route('**/api/**', (route) => {
    const objeto = /\/me\/home|\/me\/readiness|\/onboarding|\/calibracao|intervals-icu|\/checkins\//.test(route.request().url())
    route.fulfill({ status: 200, contentType: 'application/json', body: objeto ? '{}' : '[]' })
  })
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json(ME)))
  await page.route('**/api/v1/planos/atleta-uuid**', (route) => route.fulfill({ status: 404 }))
  // Forma real de `GET /me/treinos` com o flag de add-activity-treadmill-flag; sem trajeto.
  await page.route('**/api/v1/atletas/me/treinos**', (route) => route.fulfill(json([{
    id: 'tr1', dataTreino: hojeIso(), tipoTreino: 'CONTINUO', duracaoMin: '50:30', distanciaKm: 10, fcMedia: 146, tssCalculado: 58,
    fonteDados: { value: 'GARMIN', label: 'Garmin' }, deviceName: 'Forerunner 265',
    status: { value: 'REALIZADO', label: 'Realizado' }, temTrajeto: false, esteira,
  }])))
  await page.route('**/api/v1/atletas/me/consentimentos/trajeto-compartilhamento', (route) => {
    consultouConsentimento = true
    route.fulfill(json({ granted: false, policyVersion: '2026-11-09' }))
  })
  return () => consultouConsentimento
}

function dimensoesPng(caminho: string) {
  const b = readFileSync(caminho)
  expect(b.subarray(1, 4).toString('ascii')).toBe('PNG')
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('Atleta — card Esteira', () => {
  test('treino de esteira: escolher "Esteira" baixa o PNG story em 1080×1920 (CA5)', async ({ page }, testInfo) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockar(page, true)
    await page.goto('/#/athlete/share/tr1')

    await expect(page.getByRole('radio', { name: 'Rota' })).toHaveCount(0)
    await page.getByRole('radio', { name: 'Esteira' }).click()
    await expect(page.getByRole('radio', { name: 'Story 9:16' })).toBeChecked()
    await expect(page.getByTestId('selo-esteira')).toContainText('ESTEIRA')
    await expect(page.getByRole('img', { name: /Card Esteira: 10,0 km na esteira/ })).toBeVisible()

    const salvar = page.getByRole('button', { name: 'Salvar' })
    await expect(salvar).toBeEnabled({ timeout: 20_000 })
    const [download] = await Promise.all([page.waitForEvent('download'), salvar.click()])
    expect(download.suggestedFilename()).toBe('menthoros-esteira-story.png')
    expect(dimensoesPng(await download.path())).toEqual({ w: 1080, h: 1920 })
    await download.saveAs(testInfo.outputPath(download.suggestedFilename()))
  })

  test('Foto na esteira: selo no lugar do trajeto, sem consultar o consentimento (CA7)', async ({ page }, testInfo) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    const consultou = await mockar(page, true)
    await page.goto('/#/athlete/share/tr1')

    await page.getByRole('radio', { name: 'Foto' }).click()
    await expect(page.getByRole('button', { name: 'Salvar' })).toBeDisabled()
    await page.getByTestId('input-foto').setInputFiles({ name: 'esteira.png', mimeType: 'image/png', buffer: FOTO })
    await expect(page.getByRole('button', { name: /Adesivo esteira/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Adesivo trajeto/ })).toHaveCount(0)

    const salvar = page.getByRole('button', { name: 'Salvar' })
    await expect(salvar).toBeEnabled({ timeout: 20_000 })
    const [download] = await Promise.all([page.waitForEvent('download'), salvar.click()])
    expect(dimensoesPng(await download.path())).toEqual({ w: 1080, h: 1920 })
    await download.saveAs(testInfo.outputPath(download.suggestedFilename()))
    expect(consultou()).toBe(false)
  })

  test('treino de rua sem GPS: nem Esteira nem Foto', async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await mockar(page, false)
    await page.goto('/#/athlete/share/tr1')

    await expect(page.getByRole('radio', { name: 'Semana' })).toBeChecked()
    await expect(page.getByRole('radio', { name: 'Esteira' })).toHaveCount(0)
    await expect(page.getByRole('radio', { name: 'Foto' })).toHaveCount(0)
  })
})
