import { test, expect, type Page, type Request } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Consentimento do trajeto GPS nos cards — gate da change `lgpd-trajeto-cards-compartilhamento`.
 *
 * Fluxo crítico de consentimento LGPD (dado sensível). O que só aqui se prova: a chave em
 * Perfil > Privacidade lê o estado do servidor; ligar abre o aviso e só concede ao confirmar,
 * enviando a versão da Política que a página apresentou; desligar revoga; e a Política pública tem
 * a § 6.4 que o aviso referencia.
 */

const PERFIL_URL = '/#/athlete/profile'
const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: true }
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function mockar(page: Page, grantedInicial: boolean) {
  const chamadas: Request[] = []
  let granted = grantedInicial
  await page.route('**/api/**', (route) => {
    const objeto = /\/me\/home|\/me\/readiness|\/onboarding|\/calibracao|intervals-icu|\/checkins\/|\/dispositivo/.test(route.request().url())
    route.fulfill({ status: 200, contentType: 'application/json', body: objeto ? '{}' : '[]' })
  })
  await page.route('**/api/v1/users/me**', (route) => route.fulfill(json(ME)))
  await page.route('**/api/v1/atletas/me/consentimentos/trajeto-compartilhamento', (route) => {
    const req = route.request()
    chamadas.push(req)
    if (req.method() === 'POST') granted = true
    if (req.method() === 'DELETE') granted = false
    route.fulfill(json({ granted, policyVersion: '2026-11-09', registradoEm: null }, req.method() === 'POST' ? 201 : 200))
  })
  return chamadas
}

test.use({ viewport: { width: 390, height: 844 } })

test.describe('Atleta — consentimento do trajeto nos cards', () => {
  test('ligar abre o aviso, confirmar concede com a versão apresentada; desligar revoga', async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    const chamadas = await mockar(page, false)
    await page.goto(PERFIL_URL)

    const chave = page.getByRole('switch', { name: /Mostrar meu trajeto/ })
    await expect(chave).not.toBeChecked()
    await chave.click()

    const aviso = page.getByRole('dialog', { name: 'Seu trajeto vai aparecer na imagem' })
    await expect(aviso).toContainText('incluindo onde você começou e terminou')
    expect(chamadas.filter((r) => r.method() === 'POST')).toHaveLength(0)

    await aviso.getByRole('button', { name: 'Entendi, mostrar trajeto' }).click()
    await expect(aviso).toBeHidden()
    await expect(chave).toBeChecked()
    const post = chamadas.find((r) => r.method() === 'POST')
    expect(post?.postDataJSON()).toEqual({ policyVersion: '2026-11-09' })

    await chave.click()
    await expect(chave).not.toBeChecked()
    expect(chamadas.some((r) => r.method() === 'DELETE')).toBe(true)
  })

  test('"Agora não" fecha o aviso sem conceder', async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    const chamadas = await mockar(page, false)
    await page.goto(PERFIL_URL)

    await page.getByRole('switch', { name: /Mostrar meu trajeto/ }).click()
    await page.getByRole('button', { name: 'Agora não' }).click()

    await expect(page.getByRole('switch', { name: /Mostrar meu trajeto/ })).not.toBeChecked()
    expect(chamadas.filter((r) => r.method() === 'POST')).toHaveLength(0)
  })

  test('a Política pública tem a § 6.4 com início e fim do trajeto', async ({ page }) => {
    await page.goto('/#/privacidade')
    await expect(page.getByText('6.4 Compartilhamento feito pelo próprio atleta')).toBeVisible()
    await expect(page.getByText(/trajeto completo do treino, incluindo os pontos de início e fim/)).toBeVisible()
    await expect(page.getByText('Última atualização: 9 de novembro de 2026')).toBeVisible()
  })
})
