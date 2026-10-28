import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Zonas do atleta na revisão e no editor de etapas (coach-zonas-pace-fc-prescricao, seção 7).
 *
 * **Por que E2E.** É um fluxo coach-in-the-loop: o que sai do editor é gravado no plano de um atleta
 * real. Os testes de componente mocam o hook e o `onSave`; aqui rodam o roteador, o storage e a rede
 * reais (só o backend é interceptado), e se afirma o corpo do PATCH que chega à API.
 *
 * O payload de zonas segue o que o backend **de fato** serializa: `fc`, `pace` e as datas vêm como
 * `null` (não ausentes) — foi esse formato que derrubou a revisão com "Cannot read properties of
 * null (reading 'min')" enquanto todos os fixtures dos testes de unidade omitiam o campo.
 */

const REVIEW_URL = '/#/coach/planos/revisao'
const ME_API = '**/api/v1/users/me**'
const REVIEW_API = '**/api/v1/coach/planos/revisao*'
const PATCH_API = '**/api/v1/coach/planos/*/treinos/*'
const ZONAS_API = '**/api/v1/coach/atletas/*/zonas'

const PLANO_ID = '11111111-1111-1111-1111-111111111111'
const TREINO_ID = '22222222-2222-2222-2222-222222222222'
const ATLETA_ID = '33333333-3333-3333-3333-333333333333'

/** Atleta com pace de limiar 5:00 e FC de limiar 168. Z6 não tem FC. */
const ZONAS_COMPLETAS = {
  modelo: 'LTHR_FRIEL',
  ancoras: { paceLimiarMinKm: 5, dataUltimoTestePace: '2026-09-12', fcLimiar: 168, dataUltimoTesteFc: '2026-09-12', fcLimiarEstimada: false },
  ajusteFadiga: { segundosPorKm: 0, tsbProntidao: null },
  fcMaxima: { bpm: 185, estimada: false },
  disponibilidade: { pace: true, fc: true, motivoPace: null },
  zonas: [
    { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 }, motivoFc: null },
    { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 }, motivoFc: null },
    { numero: 3, nome: 'Tempo', pace: { minSegKm: 300, maxSegKm: 315 }, fc: { min: 150, max: 158 }, motivoFc: null },
    { numero: 4, nome: 'Limiar', pace: { minSegKm: 285, maxSegKm: 300 }, fc: { min: 158, max: 168 }, motivoFc: null },
    { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 }, motivoFc: null },
    { numero: 6, nome: 'Sprint', pace: { minSegKm: 246, maxSegKm: 270 }, fc: null, motivoFc: 'FC_NAO_ESTABILIZA' },
  ],
}

/** Atleta sem pace de limiar: pace e data do teste de pace vêm null, nenhuma zona tem pace. */
const ZONAS_SEM_PACE = {
  ...ZONAS_COMPLETAS,
  ancoras: { paceLimiarMinKm: null, dataUltimoTestePace: null, fcLimiar: 168, dataUltimoTesteFc: '2026-09-12', fcLimiarEstimada: false },
  disponibilidade: { pace: false, fc: true, motivoPace: 'SEM_PACE_LIMIAR' },
  zonas: ZONAS_COMPLETAS.zonas.map(z => ({ ...z, pace: null })),
}

type EtapaApi = {
  ordem: number
  tipoEtapa: string
  duracaoMin: number
  fcAlvoEtapa?: string
  ritmoAlvo?: string
  alvoPrimario?: string
}

const ETAPAS_INICIAIS: EtapaApi[] = [
  { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10, fcAlvoEtapa: '126-143 bpm', ritmoAlvo: '5:45-6:15/km', alvoPrimario: 'FC' },
  // Etapa como a IA entrega hoje: sem eixo gravado (alvoPrimario é escolha do treinador)
  { ordem: 2, tipoEtapa: 'INTERVALADO', duracaoMin: 30, fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km' },
  { ordem: 3, tipoEtapa: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvoEtapa: '126-143 bpm', ritmoAlvo: '5:45-6:15/km', alvoPrimario: 'FC' },
]

function montarPlano(etapas: EtapaApi[], zonaAlvo = 'Z2') {
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
        zonaAlvo,
        percepcaoEsforcoEsperada: 7,
        tssPlanejado: 55,
        editadoPeloCoach: false,
        etapas,
      },
    ],
  }
}

/** Mocka o backend; o plano é estado: o PATCH atualiza as etapas e a tela relida as vê. */
async function mockarApis(page: Page, zonas: unknown) {
  let plano = montarPlano(ETAPAS_INICIAIS)

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
    route.fulfill({ json: status === 'AGUARDANDO_REVISAO' ? [plano] : [] })
  })
  await page.route('**/api/v1/coach/dashboard*', route => route.fulfill({ json: {} }))
  await page.route(ZONAS_API, route => route.fulfill({ json: zonas }))

  const patches: Array<Record<string, unknown>> = []
  await page.route(PATCH_API, async route => {
    const patch = route.request().postDataJSON() as { etapas?: EtapaApi[]; zonaAlvo?: string }
    patches.push(patch)
    if (patch.etapas) {
      const etapas = patch.etapas.map((e, i) => ({ ...e, ordem: i + 1 }))
      plano = montarPlano(etapas, patch.zonaAlvo ?? plano.treinosPlanejados[0].zonaAlvo)
    }
    await route.fulfill({ json: { ...plano.treinosPlanejados[0], editadoPeloCoach: true } })
  })
  return patches
}

async function abrirEdicaoDoTreino(page: Page) {
  await autenticarComPkce(page, { roles: ['TECNICO'] })
  await page.goto(REVIEW_URL)
  await page.getByRole('button', { name: /Atleta Teste/i }).click()
}

test.describe('revisão do plano — zonas do atleta no editor', () => {
  test('escolher Z5 numa etapa grava pace e FC iguais aos da tabela, com o eixo pace, e o card mostra Zn · pace · FC', async ({ page }) => {
    const patches = await mockarApis(page, ZONAS_COMPLETAS)
    await abrirEdicaoDoTreino(page)

    // A tabela do atleta, recolhida por padrão, abre e mostra a linha de Z5 (valores sem unidade, na ordem do protótipo)
    const tabela = page.getByRole('button', { name: /zonas de atleta/i })
    await expect(tabela).toHaveAttribute('aria-expanded', 'false')
    await tabela.click()
    const linhaZ5 = page.getByRole('row', { name: /Z5/ })
    await expect(linhaZ5).toContainText('4:30 – 4:45')
    await expect(linhaZ5).toContainText('168 – 178')

    // O card já mostra a linha de intensidade da etapa de esforço (Z2 hoje)
    await expect(page.getByTestId('linha-intensidade').first()).toContainText('Z2')

    // Editor: abre a etapa de esforço, escolhe Z5
    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await page.getByRole('button', { name: /editar intensidade — tipo da etapa 2/i }).click()
    await page.getByRole('radio', { name: 'Z5' }).click()

    // Os valores preenchidos são exatamente os da tabela, e o tiro pré-seleciona pace
    await expect(page.getByTestId('pilula-pace')).toHaveText('4:30–4:45 /km')
    await expect(page.getByTestId('pilula-fc')).toHaveText('168–178 bpm')
    await expect(page.getByRole('radio', { name: 'Pace' })).toHaveAttribute('aria-checked', 'true')

    await page.getByRole('button', { name: /^salvar$/i }).click()
    await expect.poll(() => patches.length).toBe(1)

    // O corpo do PATCH em formato canônico (o que o parser do relógio lê) e o eixo escolhido
    const patch = patches[0] as { etapas?: EtapaApi[]; zonaAlvo?: string }
    expect(patch.etapas?.find(e => e.tipoEtapa === 'INTERVALADO')).toMatchObject({
      ritmoAlvo: '4:30-4:45/km',
      fcAlvoEtapa: '168-178 bpm',
      alvoPrimario: 'PACE',
    })
    expect(patch.zonaAlvo).toBe('Z5')

    // E o card, relido, mostra zona + valores em ordem fixa (pace → FC)
    const linha = page.getByTestId(`tag-treino-${TREINO_ID}`).getByTestId('linha-intensidade')
    await expect(linha).toContainText('Z5')
    await expect(linha).toContainText('4:30–4:45')
    await expect(linha).toContainText('168–178 bpm')
  })

  test('atleta sem pace de limiar: o seletor preenche só a FC, avisa, e o PATCH não leva ritmoAlvo', async ({ page }) => {
    const patches = await mockarApis(page, ZONAS_SEM_PACE)
    await abrirEdicaoDoTreino(page)

    // A tabela do atleta sem pace renderiza (datas e pace null) e diz o que falta, sem link
    await page.getByRole('button', { name: /zonas de atleta/i }).click()
    await expect(page.getByText(/pace indisponível — cadastre o pace de limiar/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /limiar/i })).toHaveCount(0)

    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await page.getByRole('button', { name: /editar intensidade — tipo da etapa 2/i }).click()

    // Z6 só existe em pace: sem pace de limiar fica desabilitado
    await expect(page.getByRole('radio', { name: 'Z6' })).toBeDisabled()
    await page.getByRole('radio', { name: 'Z5' }).click()

    await expect(page.getByTestId('pilula-pace')).toHaveText('pace indisponível')
    await expect(page.getByTestId('pilula-fc')).toHaveText('168–178 bpm')
    await expect(page.getByTestId('eixo-unico')).toHaveText('FC · único eixo')
    await expect(page.getByText(/sem pace de limiar: a zona grava só a fc/i)).toBeVisible()

    await page.getByRole('button', { name: /^salvar$/i }).click()
    await expect.poll(() => patches.length).toBe(1)

    const patch = patches[0] as { etapas?: EtapaApi[] }
    const tiro = patch.etapas?.find(e => e.tipoEtapa === 'INTERVALADO')
    expect(tiro).toMatchObject({ fcAlvoEtapa: '168-178 bpm', alvoPrimario: 'FC' })
    expect(tiro?.ritmoAlvo, 'sem pace de limiar nenhum ritmo é inventado').toBeUndefined()
  })
})
