import { test, expect } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Marca do relógio no onboarding — change `add-watch-brand-connection-guide`.
 *
 * O que só aqui se prova: os oito chips aparecem na ordem do founder e a marca escolhida chega ao
 * `POST` do rascunho com o valor do enum que o backend aceita (`AMAZFIT`), pelo router e pela rede
 * reais. Regra de matriz e rótulos ficam nos testes unitários.
 */

const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: false }
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

const ORDEM = ['Garmin', 'Apple Watch', 'Amazfit', 'Coros', 'Samsung Galaxy Watch', 'Polar', 'Suunto', 'Outro']

test.describe('Atleta — marca do relógio no onboarding', () => {
  test('oito chips em ordem e a marca escolhida vai no rascunho', async ({ page }) => {
    await autenticarComPkce(page, { roles: ['ATLETA'] })

    let corpoDoRascunho: Record<string, unknown> | undefined
    await page.route('**/api/**', (r) => r.fulfill(json([])))
    await page.route('**/api/v1/users/me**', (r) => r.fulfill(json(ME)))
    await page.route('**/api/v1/atletas/*/onboarding', (r) => {
      if (r.request().method() === 'POST') {
        corpoDoRascunho = r.request().postDataJSON()
        return r.fulfill(json({ id: 'p1', status: 'RASCUNHO', preenchidoPorCoach: false, criadoEm: '2026-10-19T10:00:00Z', atualizadoEm: '2026-10-19T10:00:00Z', ...corpoDoRascunho }))
      }
      return r.fulfill({ status: 204 })
    })

    await page.goto('/#/athlete/onboarding')

    await expect(page.getByRole('radio', { name: 'Garmin' })).toBeVisible()
    const marcas = await page.getByRole('radio').evaluateAll(
      (els, ordem) => els.map((el) => el.textContent ?? '').filter((nome) => ordem.includes(nome)),
      ORDEM,
    )
    expect(marcas).toEqual(ORDEM)

    await page.getByRole('radio', { name: 'Avançado' }).click()
    await page.getByRole('radio', { name: 'Amazfit' }).click()
    await page.getByRole('radio', { name: 'intervals.icu' }).click()
    await page.getByRole('button', { name: 'Avançar' }).click()

    await expect(page.getByRole('button', { name: 'Voltar' })).toBeEnabled()
    expect(corpoDoRascunho).toMatchObject({ dispositivoMarca: 'AMAZFIT' })
  })
})
