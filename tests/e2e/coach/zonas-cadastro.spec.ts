import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Cadastro de âncoras das zonas (coach-cadastro-ancoras-zonas, CA13).
 *
 * **Por que E2E.** O que o treinador grava aqui alimenta o motor: a IA prescreve sobre o limiar e o
 * push ao relógio converte alvo relativo com ele. Os testes de componente mocam o service; aqui
 * rodam roteador, diálogo, debounce da prévia e rede reais (só o backend é interceptado), e se
 * afirma o corpo do PUT que chega à API e o card relido depois de salvar.
 *
 * O backend é estado: o PUT atualiza as zonas devolvidas pelo GET seguinte, como o real.
 */

const REVIEW_URL = '/#/coach/planos/revisao'
const ME_API = '**/api/v1/users/me**'
const REVIEW_API = '**/api/v1/coach/planos/revisao*'
const ZONAS_API = '**/api/v1/coach/atletas/*/zonas'
const ANCORAS_API = '**/api/v1/coach/atletas/*/zonas/ancoras'
const SIMULACAO_API = '**/api/v1/coach/atletas/*/zonas/simulacao'

const PLANO_ID = '11111111-1111-1111-1111-111111111111'
const ATLETA_ID = '33333333-3333-3333-3333-333333333333'

const FAIXAS_FC = [
  { numero: 1, nome: 'Recuperação', fc: { min: 126, max: 143 } },
  { numero: 2, nome: 'Aeróbico', fc: { min: 143, max: 150 } },
  { numero: 3, nome: 'Tempo', fc: { min: 150, max: 158 } },
  { numero: 4, nome: 'Limiar', fc: { min: 158, max: 168 } },
  { numero: 5, nome: 'VO2max', fc: { min: 168, max: 178 } },
  { numero: 6, nome: 'Sprint', fc: null },
]

/** Pace de limiar 4:50 (290 s/km): faixas distintas das do fixture 5:00 do outro spec. */
const PACE_290 = [
  { minSegKm: 333, maxSegKm: 360 },
  { minSegKm: 305, maxSegKm: 333 },
  { minSegKm: 290, maxSegKm: 305 },
  { minSegKm: 276, maxSegKm: 290 },
  { minSegKm: 261, maxSegKm: 276 },
  { minSegKm: 238, maxSegKm: 261 },
]

function zonas(comPace: boolean) {
  return {
    modelo: 'LTHR_FRIEL',
    ancoras: {
      paceLimiarMinKm: comPace ? 4.83 : null,
      dataUltimoTestePace: comPace ? '2026-11-03' : null,
      fcLimiar: 168,
      dataUltimoTesteFc: '2026-09-12',
      fcLimiarEstimada: false,
      fonteLimiarFc: 'TESTE_CAMPO',
      fonteLimiarPace: comPace ? 'TESTE_CAMPO' : null,
    },
    ajusteFadiga: { segundosPorKm: 0, tsbProntidao: null },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: comPace, fc: true, motivoPace: comPace ? null : 'SEM_PACE_LIMIAR' },
    zonas: FAIXAS_FC.map((z, i) => ({ ...z, pace: comPace ? PACE_290[i] : null, motivoFc: z.fc ? null : 'FC_NAO_ESTABILIZA' })),
  }
}

type Corpo = { fc?: { limiar: number; maxima: number | null }; pace?: { limiarSegKm: number; origem?: string | null } }

async function mockarApis(page: Page) {
  let atual = zonas(false)
  const puts: Corpo[] = []
  const simulacoes: Corpo[] = []

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
  const plano = {
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
    treinosPlanejados: [],
  }
  await page.route(REVIEW_API, route => {
    const status = new URL(route.request().url()).searchParams.get('status')
    route.fulfill({ json: status === 'AGUARDANDO_REVISAO' ? [plano] : [] })
  })
  await page.route('**/api/v1/coach/dashboard*', route => route.fulfill({ json: {} }))
  await page.route(ZONAS_API, route => route.fulfill({ json: atual }))
  await page.route(SIMULACAO_API, route => {
    simulacoes.push(route.request().postDataJSON() as Corpo)
    route.fulfill({ json: zonas(true) })
  })
  await page.route(ANCORAS_API, route => {
    const corpo = route.request().postDataJSON() as Corpo
    puts.push(corpo)
    if (corpo.pace) atual = zonas(true)
    if (corpo.fc) atual = { ...atual, ancoras: { ...atual.ancoras, fcLimiar: corpo.fc.limiar } }
    route.fulfill({ json: atual })
  })
  return { puts, simulacoes }
}

async function abrirPlano(page: Page) {
  await autenticarComPkce(page, { roles: ['TECNICO'] })
  await page.goto(REVIEW_URL)
  await page.getByRole('button', { name: /Atleta Teste/i }).click()
}

test.describe('cadastro de zonas do atleta', () => {
  test('atleta sem ritmo: cadastra o pace de limiar 4:50 e o card mostra a coluna de ritmo', async ({ page }) => {
    const { puts, simulacoes } = await mockarApis(page)
    await abrirPlano(page)

    await page.getByRole('button', { name: /zonas de atleta/i }).click()
    // Sem ritmo cadastrado a coluna de pace da Z5 está vazia (a 1ª célula; a Zona é rowheader)
    await expect(page.getByRole('row', { name: /Z5/ }).getByRole('cell').first()).toHaveText('—')

    // O aviso abre o diálogo direto na aba Ritmo (CA10)
    await page.getByRole('button', { name: 'Cadastrar ritmo de limiar' }).click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo.getByRole('tab', { name: 'Zonas de Ritmo', selected: true })).toBeVisible()

    // Inválido: erro no blur, sem prévia e sem simulação (CA11)
    const ritmo = dialogo.getByLabel(/Ritmo de limiar/)
    await ritmo.fill('1:00')
    await ritmo.blur()
    await expect(dialogo.getByText('Ritmo entre 2:30 e 12:00 /km')).toBeVisible()
    await expect(dialogo.getByRole('button', { name: 'Salvar zonas' })).toBeDisabled()
    expect(simulacoes).toHaveLength(0)

    // Válido: prévia vem da simulação do backend
    await ritmo.fill('4:50')
    await expect(dialogo.getByTestId('previa-zonas')).toBeVisible()
    expect(simulacoes.at(-1)).toMatchObject({ pace: { limiarSegKm: 290 } })
    expect(simulacoes.at(-1)?.fc).toBeUndefined()

    await dialogo.getByRole('button', { name: 'Salvar zonas' }).click()
    await expect(page.getByText('Zonas atualizadas')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // Só o eixo alterado vai no PUT (CA3)
    expect(puts).toHaveLength(1)
    expect(puts[0].pace).toMatchObject({ limiarSegKm: 290 })
    expect(puts[0].fc).toBeUndefined()

    // O card relido mostra o ritmo, sem recarregar a página (CA12); o aviso some
    const z5 = page.getByRole('row', { name: /Z5/ })
    await expect(z5).toContainText('4:21 – 4:36')
    await expect(page.getByText('Ritmo não cadastrado.')).toHaveCount(0)
  })

  test('"Editar zonas" abre na aba FC com os valores atuais e grava o novo limiar', async ({ page }) => {
    const { puts } = await mockarApis(page)
    await abrirPlano(page)

    await page.getByRole('button', { name: 'Editar zonas' }).click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo.getByRole('tab', { name: 'Zonas de FC', selected: true })).toBeVisible()
    await expect(dialogo.getByLabel('FC de limiar (bpm)')).toHaveValue('168')
    await expect(dialogo.getByLabel('FC máxima (bpm)')).toHaveValue('185')
    await expect(dialogo.getByText(/Treinos já criados com alvo em bpm ou ritmo fixo não mudam/)).toBeVisible()

    await dialogo.getByLabel('FC de limiar (bpm)').fill('170')
    await dialogo.getByRole('button', { name: 'Salvar zonas' }).click()
    await expect(page.getByText('Zonas atualizadas')).toBeVisible()

    expect(puts).toHaveLength(1)
    expect(puts[0].fc).toMatchObject({ limiar: 170, maxima: 185 })
    expect(puts[0].pace).toBeUndefined()
  })
})
