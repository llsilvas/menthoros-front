import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Modo "Informar manualmente" das zonas (coach-zonas-manuais, CA7).
 *
 * **Por que E2E.** A faixa manual vira a referência de toda prescrição do atleta: o seletor de zona
 * do editor de etapas e o card leem o mesmo GET. Os testes de componente mocam o service; aqui rodam
 * roteador, diálogo, invalidação do cache de zonas e rede reais (só o backend é interceptado), e se
 * afirma o corpo do PUT e o que o card e o editor mostram depois de salvar.
 *
 * O backend é estado: o PUT de manuais muda o GET seguinte, como o real (faixa efetiva + a do limiar).
 */

const REVIEW_URL = '/#/coach/planos/revisao'
const ME_API = '**/api/v1/users/me**'
const REVIEW_API = '**/api/v1/coach/planos/revisao*'
const ZONAS_API = '**/api/v1/coach/atletas/*/zonas'
const MANUAIS_API = '**/api/v1/coach/atletas/*/zonas/manuais'
const SIMULACAO_API = '**/api/v1/coach/atletas/*/zonas/simulacao'

const PLANO_ID = '11111111-1111-1111-1111-111111111111'
const TREINO_ID = '22222222-2222-2222-2222-222222222222'
const ATLETA_ID = '33333333-3333-3333-3333-333333333333'

const ZONAS_LIMIAR = [
  { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 }, motivoFc: null },
  { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 }, motivoFc: null },
  { numero: 3, nome: 'Tempo', pace: { minSegKm: 300, maxSegKm: 315 }, fc: { min: 150, max: 158 }, motivoFc: null },
  { numero: 4, nome: 'Limiar', pace: { minSegKm: 285, maxSegKm: 300 }, fc: { min: 158, max: 168 }, motivoFc: null },
  { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 }, motivoFc: null },
  { numero: 6, nome: 'Sprint', pace: { minSegKm: 246, maxSegKm: 270 }, fc: null, motivoFc: 'FC_NAO_ESTABILIZA' },
]

type Faixa = { zona: number; min: number; max: number }
type CorpoManual = { fc?: { modo: string; faixas?: Faixa[] }; pace?: { modo: string; faixas?: Faixa[] } }

function zonas(paceManual: Faixa[] | null) {
  return {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, dataUltimoTestePace: '2026-09-12', fcLimiar: 168, dataUltimoTesteFc: '2026-09-12', fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0, tsbProntidao: null },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true, motivoPace: null },
    modos: { fc: 'LIMIAR', pace: paceManual ? 'MANUAL' : 'LIMIAR' },
    zonas: ZONAS_LIMIAR.map((z, i) => ({
      ...z,
      pace: paceManual ? { minSegKm: paceManual[i].min, maxSegKm: paceManual[i].max } : z.pace,
      pacePeloLimiar: paceManual ? z.pace : null,
      fcPeloLimiar: null,
    })),
  }
}

function plano() {
  return {
    id: PLANO_ID,
    atletaId: ATLETA_ID,
    semanaInicio: '2026-08-17',
    semanaFim: '2026-08-23',
    volumePlanejadoKm: 40,
    volumeRealizadoKm: 0,
    volumeAlvoKm: 40,
    status: 'PLANEJADO',
    reviewStatus: 'AGUARDANDO_REVISAO',
    atletaNome: 'Atleta Teste',
    objetivoSemanal: 'Base aeróbica',
    treinosPlanejados: [
      {
        id: TREINO_ID,
        diaSemana: 'QUINTA',
        tipoTreino: 'INTERVALADO',
        distanciaKm: 8,
        duracaoMin: 'PT45M',
        zonaAlvo: 'Z2',
        percepcaoEsforcoEsperada: 5,
        tssPlanejado: 45,
        editadoPeloCoach: false,
        etapas: [
          { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10, fcAlvoEtapa: '126-143 bpm', ritmoAlvo: '5:45-6:15/km', alvoPrimario: 'FC' },
          { ordem: 2, tipoEtapa: 'INTERVALADO', duracaoMin: 30, fcAlvoEtapa: '150-158 bpm', ritmoAlvo: '5:00-5:15/km' },
          { ordem: 3, tipoEtapa: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvoEtapa: '126-143 bpm', ritmoAlvo: '5:45-6:15/km', alvoPrimario: 'FC' },
        ],
      },
    ],
  }
}

async function mockarApis(page: Page) {
  let atual = zonas(null)
  const puts: CorpoManual[] = []

  await page.route(ME_API, route =>
    route.fulfill({
      json: {
        id: 'coach-1',
        nome: 'Coach',
        email: 'coach@test.dev',
        roles: ['TECNICO'],
        assessoria: { id: 'tenant-uuid', nome: 'Assessoria Teste' },
        lgpdConsentGranted: true,
        lgpdCurrentPolicyVersion: '2026-06-30',
        lgpdCurrentTermsVersion: '2026-06-30',
        lgpdAcceptedPolicyVersion: '2026-06-30',
        lgpdAcceptedTermsVersion: '2026-06-30',
        onboardingConcluido: true,
      },
    }),
  )
  await page.route(REVIEW_API, route => {
    const status = new URL(route.request().url()).searchParams.get('status')
    route.fulfill({ json: status === 'AGUARDANDO_REVISAO' ? [plano()] : [] })
  })
  await page.route('**/api/v1/coach/dashboard*', route => route.fulfill({ json: {} }))
  await page.route(ZONAS_API, route => route.fulfill({ json: atual }))
  await page.route(SIMULACAO_API, route => route.fulfill({ json: atual }))
  await page.route(MANUAIS_API, route => {
    const corpo = route.request().postDataJSON() as CorpoManual
    puts.push(corpo)
    if (corpo.pace) atual = zonas(corpo.pace.modo === 'MANUAL' ? (corpo.pace.faixas ?? null) : null)
    route.fulfill({ json: atual })
  })
  return { puts }
}

test.describe('zonas manuais', () => {
  test('ritmo manual com Z2 editada chega ao card e ao seletor de zona do editor de etapas', async ({ page }) => {
    const { puts } = await mockarApis(page)
    await autenticarComPkce(page, { roles: ['TECNICO'] })
    await page.goto(REVIEW_URL)
    await page.getByRole('button', { name: /Atleta Teste/i }).click()

    await page.getByRole('button', { name: 'Editar zonas' }).click()
    const dialogo = page.getByRole('dialog')
    await dialogo.getByRole('tab', { name: 'Zonas de Ritmo' }).click()
    await dialogo.getByRole('button', { name: /Informar manualmente/ }).click()

    // Pré-preenchido com o cálculo pelo limiar
    const z2De = dialogo.getByRole('textbox', { name: 'Z2 De' })
    await expect(z2De).toHaveValue('5:15')

    // Sobreposição com a Z1 marca a linha e bloqueia salvar (CA3)
    const z2Ate = dialogo.getByRole('textbox', { name: 'Z2 Até' })
    await z2Ate.fill('5:50')
    await expect(z2Ate).toHaveAttribute('aria-invalid', 'true')
    await expect(dialogo.getByRole('button', { name: 'Salvar zonas' })).toBeDisabled()

    // Faixa válida: Z2 = 5:10–5:40, Z1 encostada na borda
    await z2De.fill('5:10')
    await z2Ate.fill('5:40')
    await dialogo.getByRole('textbox', { name: 'Z1 De' }).fill('5:40')
    await dialogo.getByRole('textbox', { name: 'Z3 Até' }).fill('5:10')
    await dialogo.getByRole('button', { name: 'Salvar zonas' }).click()
    await expect(page.getByText('Zonas atualizadas')).toBeVisible()

    // Só o eixo de ritmo, em MANUAL, com a Z2 em s/km
    expect(puts).toHaveLength(1)
    expect(puts[0].fc).toBeUndefined()
    expect(puts[0].pace?.modo).toBe('MANUAL')
    expect(puts[0].pace?.faixas?.[1]).toEqual({ zona: 2, min: 310, max: 340 })

    // Card relido: a Z2 manual e a origem de cada eixo (CA5)
    const card = page.getByRole('button', { name: /zonas de atleta/i })
    await expect(card).toContainText('FC: pelo limiar · Ritmo: manual')
    if ((await card.getAttribute('aria-expanded')) === 'false') await card.click()
    await expect(page.getByRole('row', { name: /Z2/ })).toContainText('5:10 – 5:40')

    // Editor de etapas: escolher Z2 preenche o ritmo com a faixa manual
    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await page.getByRole('button', { name: /editar intensidade — tipo da etapa 2/i }).click()
    await page.getByRole('radio', { name: 'Z2' }).click()
    await expect(page.getByTestId('pilula-pace')).toHaveText('5:10–5:40 /km')
  })
})
