import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Onboarding do atleta de ponta a ponta — change `improve-athlete-onboarding-usability`.
 *
 * Fluxo crítico (é a entrada de dados que alimenta o motor de plano), então a cobertura é no
 * browser real: o que só aqui se prova é que o atleta chega ao onboarding pela Home, percorre os
 * cinco passos no celular com o mínimo obrigatório, pula o que é opcional, conclui SEM prova e o
 * `POST /concluir` sai com corpo vazio — o contrato que o backend passou a aceitar.
 */

const ME = { id: 'user-uuid', atletaId: 'atleta-uuid', nome: 'Marina Teste', email: 'marina@teste.com', lgpdConsentGranted: true, onboardingConcluido: false }
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function mockarApis(page: Page) {
  const chamadas = { rascunhos: [] as Record<string, unknown>[], conclusao: undefined as Record<string, unknown> | undefined }
  await page.route('**/api/**', (r) => r.fulfill(json([])))
  await page.route('**/api/v1/users/me**', (r) => r.fulfill(json(ME)))
  await page.route('**/api/v1/atletas/*/onboarding', (r) => {
    if (r.request().method() === 'POST') {
      const corpo = r.request().postDataJSON()
      chamadas.rascunhos.push(corpo)
      return r.fulfill(json({ id: 'p1', status: 'RASCUNHO', preenchidoPorCoach: false, criadoEm: '2026-10-19T10:00:00Z', atualizadoEm: '2026-10-19T10:00:00Z', ...corpo }))
    }
    return r.fulfill({ status: 204 })
  })
  await page.route('**/api/v1/atletas/*/onboarding/concluir', (r) => {
    chamadas.conclusao = r.request().postDataJSON()
    return r.fulfill(json({ status: 'COMPLETO', confidenceTier: 'C', confidenceScore: 0.2 }))
  })
  return chamadas
}

test.describe('Atleta — onboarding no celular', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('da Home ao fim sem prova: cinco passos, só o obrigatório, e o /concluir sai vazio', async ({ page }) => {
    const chamadas = await mockarApis(page)
    await autenticarComPkce(page, { roles: ['ATLETA'] })

    // Entrada pela Home — antes não existia caminho até o onboarding.
    await page.goto('/#/athlete/home')
    await page.getByRole('link', { name: /completar/i }).click()
    await expect(page).toHaveURL(/#\/athlete\/onboarding$/)

    // Celular: "Passo N de 5" no lugar do Stepper que cortava os passos 4 e 5.
    await expect(page.getByText('Passo 1 de 5')).toBeVisible()
    await expect(page.getByText(/falta: há quanto tempo você corre e seu objetivo/i)).toBeVisible()

    await page.getByRole('radio', { name: 'Iniciante' }).click()
    await page.getByRole('radio', { name: 'Começar a correr com segurança' }).click()
    await expect(page.getByText(/^falta:/i)).toHaveCount(0)
    await page.getByRole('button', { name: 'Avançar' }).click()

    await expect(page.getByText('Passo 2 de 5')).toBeVisible()
    await page.getByRole('checkbox', { name: 'Segunda' }).click()
    await page.getByRole('checkbox', { name: 'Quarta' }).click()
    await page.getByRole('button', { name: 'Avançar' }).click()

    await expect(page.getByText('Passo 3 de 5')).toBeVisible()
    await page.getByRole('button', { name: 'Pular' }).click()

    await expect(page.getByText('Passo 4 de 5')).toBeVisible()
    await page.getByRole('radio', { name: 'Outro' }).click()
    await page.getByRole('button', { name: 'Avançar' }).click()

    await expect(page.getByText('Passo 5 de 5')).toBeVisible()
    await page.getByRole('radio', { name: 'Ainda não' }).click()
    await page.getByRole('button', { name: 'Concluir' }).click()

    await expect(page.getByText(/perfil enviado/i)).toBeVisible()
    await expect(page.getByText('Nenhuma por enquanto')).toBeVisible()
    await expect(page.getByRole('link', { name: /cadastrar uma prova/i })).toHaveAttribute('href', '#/athlete/races/new')

    expect(chamadas.conclusao).toEqual({})
    const ultimoRascunho = chamadas.rascunhos.at(-1)
    expect(ultimoRascunho).toMatchObject({
      nivelExperiencia: 'INICIANTE',
      objetivo: 'Começar a correr com segurança',
      diasDisponiveis: ['SEGUNDA', 'QUARTA'],
      dispositivoMarca: 'OUTRO',
    })
    expect(ultimoRascunho).not.toHaveProperty('duracaoDisponivelMin')
    expect(ultimoRascunho).not.toHaveProperty('volumeSemanalMax')

    // Nada estoura na horizontal em 390px.
    const estoura = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(estoura).toBe(false)
  })

  test('com prova: tipo inferido pela distância e enviado inteiro', async ({ page }) => {
    const chamadas = await mockarApis(page)
    await autenticarComPkce(page, { roles: ['ATLETA'] })
    await page.goto('/#/athlete/onboarding')

    await page.getByRole('radio', { name: 'Intermediário' }).click()
    await page.getByRole('radio', { name: 'Completar minha primeira prova' }).click()
    await page.getByRole('button', { name: 'Avançar' }).click()
    await page.getByRole('checkbox', { name: 'Sábado' }).click()
    await page.getByRole('button', { name: 'Avançar' }).click()
    await page.getByRole('button', { name: 'Pular' }).click()
    await page.getByRole('radio', { name: 'Garmin' }).click()
    await page.getByRole('button', { name: 'Avançar' }).click()

    await page.getByRole('radio', { name: 'Sim, já tenho' }).click()
    await expect(page.getByText(/falta: data da prova e distância/i)).toBeVisible()
    await page.getByLabel('Data da prova').fill('2027-03-14')
    await page.getByRole('radio', { name: '21 km (Meia Maratona)' }).click()
    await page.getByLabel('Nome da prova').fill('Meia de Floripa')
    await page.getByRole('button', { name: 'Concluir' }).click()

    await expect(page.getByText(/perfil enviado/i)).toBeVisible()
    await expect(page.getByText('21 km (Meia Maratona) em 14/03/2027')).toBeVisible()
    expect(chamadas.conclusao).toEqual({ dataProva: '2027-03-14', distancia: 'KM_21', tipoProva: 'MEIA', nomeProva: 'Meia de Floripa' })
  })
})
