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
  duracaoMin?: number
  duracaoSeg?: number
  distanciaKm?: number
  fcAlvoEtapa?: string
  ritmoAlvo?: string
  alvoPrimario?: string
  blocoId?: string
  blocoRepeticoes?: number
  /** Só no payload de entrada, quando `tipoEtapa === 'BLOCO'`. */
  subEtapas?: EtapaApi[]
}

const ETAPAS_INICIAIS: EtapaApi[] = [
  { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10, fcAlvoEtapa: '126-143 bpm', ritmoAlvo: '5:45-6:15/km', alvoPrimario: 'FC' },
  // Etapa como a IA entrega hoje: sem eixo gravado (alvoPrimario é escolha do treinador)
  { ordem: 2, tipoEtapa: 'INTERVALADO', duracaoMin: 30, fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km' },
  { ordem: 3, tipoEtapa: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvoEtapa: '126-143 bpm', ritmoAlvo: '5:45-6:15/km', alvoPrimario: 'FC' },
]

/** Avulsa, série 2× (tiro + recuperação) gravada expandida com `blocoId`, avulsa. */
const ETAPAS_COM_BLOCO: EtapaApi[] = [
  { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10, fcAlvoEtapa: '126-143 bpm', alvoPrimario: 'FC' },
  { ordem: 2, tipoEtapa: 'INTERVALADO', duracaoMin: 3, ritmoAlvo: '4:30-4:45/km', alvoPrimario: 'PACE', blocoId: 'b1', blocoRepeticoes: 2 },
  { ordem: 3, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, fcAlvoEtapa: '126-143 bpm', alvoPrimario: 'FC', blocoId: 'b1', blocoRepeticoes: 2 },
  { ordem: 4, tipoEtapa: 'INTERVALADO', duracaoMin: 3, ritmoAlvo: '4:30-4:45/km', alvoPrimario: 'PACE', blocoId: 'b1', blocoRepeticoes: 2 },
  { ordem: 5, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, fcAlvoEtapa: '126-143 bpm', alvoPrimario: 'FC', blocoId: 'b1', blocoRepeticoes: 2 },
  { ordem: 6, tipoEtapa: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvoEtapa: '126-143 bpm', alvoPrimario: 'FC' },
]

/**
 * O que o backend persiste a partir do payload: um `BLOCO` vira N cópias das sub-etapas com o
 * mesmo `blocoId` (é assim que `itensFromEtapas` reconstrói a série ao reabrir o editor).
 */
function expandirPatch(etapas: EtapaApi[]): EtapaApi[] {
  const planas: EtapaApi[] = []
  etapas.forEach((e, i) => {
    if (e.tipoEtapa !== 'BLOCO') { planas.push(e); return }
    const reps = e.blocoRepeticoes ?? 1
    for (let r = 0; r < reps; r++) {
      for (const sub of e.subEtapas ?? []) planas.push({ ...sub, blocoId: `bloco-${i}`, blocoRepeticoes: reps })
    }
  })
  return planas.map((e, i) => ({ ...e, ordem: i + 1 }))
}

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
async function mockarApis(page: Page, zonas: unknown, etapasIniciais: EtapaApi[] = ETAPAS_INICIAIS) {
  let plano = montarPlano(etapasIniciais)

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
      plano = montarPlano(expandirPatch(patch.etapas), patch.zonaAlvo ?? plano.treinosPlanejados[0].zonaAlvo)
    }
    await route.fulfill({ json: { ...plano.treinosPlanejados[0], editadoPeloCoach: true } })
  })
  return patches
}

/** Valores dos selects de tipo cujo rótulo bate com `padrao`, na ordem do DOM. */
const tiposPorRotulo = (page: Page, padrao: RegExp) =>
  page.locator('select[aria-label^="Tipo da etapa"]').evaluateAll((els, fonte) => {
    const re = new RegExp(fonte)
    return els
      .filter(el => re.test(el.getAttribute('aria-label') ?? ''))
      .map(el => (el as HTMLSelectElement).value)
  }, padrao.source)

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

  test('pace e duração calculam a distância da etapa; a derivada fica fora do PATCH, a digitada vai', async ({ page }) => {
    const patches = await mockarApis(page, ZONAS_COMPLETAS)
    await abrirEdicaoDoTreino(page)

    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await page.getByRole('button', { name: /editar intensidade — tipo da etapa 2/i }).click()
    await page.getByRole('radio', { name: 'Z5' }).click()

    // 30 min no ponto médio de 4:30-4:45/km, marcada como calculada
    const distancia = page.getByLabel('Distância (km)').nth(1)
    await expect(distancia).toHaveValue('6.49')
    await expect(page.getByText('calculado de pace × duração').nth(1)).toBeVisible()

    // A derivada não vai ao PATCH: o conversor do relógio descartaria a duração
    await page.getByRole('button', { name: /^salvar$/i }).click()
    await expect.poll(() => patches.length).toBe(1)
    const derivada = (patches[0] as { etapas?: Array<EtapaApi & { distanciaKm?: number }> }).etapas?.find(e => e.tipoEtapa === 'INTERVALADO')
    expect(derivada).toMatchObject({ duracaoMin: 30, ritmoAlvo: '4:30-4:45/km' })
    expect(derivada).not.toHaveProperty('distanciaKm')

    // Reaberto, o editor recalcula a derivada a partir do que foi gravado
    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    const distancia2 = page.getByLabel('Distância (km)').nth(1)
    await expect(distancia2).toHaveValue('6.49')

    // Valor digitado vence, não é recalculado e vai ao PATCH
    await distancia2.fill('7')
    await page.getByLabel('Duração (m:ss)').nth(1).fill('35')
    await expect(distancia2).toHaveValue('7')
    await page.getByRole('button', { name: /^salvar$/i }).click()
    await expect.poll(() => patches.length).toBe(2)
    expect((patches[1] as { etapas?: Array<EtapaApi & { distanciaKm?: number }> }).etapas?.find(e => e.tipoEtapa === 'INTERVALADO'))
      .toMatchObject({ distanciaKm: 7, duracaoMin: 35, duracaoSeg: 2100 })
  })

  test('duração em m:ss: 4:10 leva duracaoSeg 250 e duracaoMin 4; 0:10 só o segundo; a etapa reabre em 4:10', async ({ page }) => {
    const patches = await mockarApis(page, ZONAS_COMPLETAS)
    await abrirEdicaoDoTreino(page)

    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    const duracao = page.getByLabel('Duração (m:ss)').nth(1)
    await expect(duracao).toHaveValue('30:00')
    await duracao.fill('4:10')
    await page.getByRole('button', { name: /^salvar$/i }).click()
    await expect.poll(() => patches.length).toBe(1)
    const tiro = (patches[0] as { etapas?: EtapaApi[] }).etapas?.find(e => e.tipoEtapa === 'INTERVALADO')
    expect(tiro).toMatchObject({ duracaoSeg: 250, duracaoMin: 4 })

    // Reaberta, a etapa gravada com duracaoSeg mostra o segundo exato, não o minuto arredondado
    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    const duracao2 = page.getByLabel('Duração (m:ss)').nth(1)
    await expect(duracao2).toHaveValue('4:10')

    // Abaixo de 30 s o minuto derivado dá 0 e fica fora: o backend deriva de duracaoSeg
    await duracao2.fill('0:10')
    await page.getByRole('button', { name: /^salvar$/i }).click()
    await expect.poll(() => patches.length).toBe(2)
    const curto = (patches[1] as { etapas?: EtapaApi[] }).etapas?.find(e => e.tipoEtapa === 'INTERVALADO')
    expect(curto?.duracaoSeg).toBe(10)
    expect(curto).not.toHaveProperty('duracaoMin')
  })

  test('duração inválida mostra erro e bloqueia o salvar: nenhum PATCH sai', async ({ page }) => {
    const patches = await mockarApis(page, ZONAS_COMPLETAS)
    await abrirEdicaoDoTreino(page)

    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await page.getByLabel('Duração (m:ss)').nth(1).fill('abc')
    await expect(page.getByText('use m:ss, ex.: 4:10')).toBeVisible()
    await expect(page.getByRole('button', { name: /^salvar$/i })).toBeDisabled()
    expect(patches).toHaveLength(0)
  })

  test('distância digitada e zona preenchem a duração; a derivada fica fora do PATCH e volta ao reabrir', async ({ page }) => {
    const patches = await mockarApis(page, ZONAS_COMPLETAS)
    await abrirEdicaoDoTreino(page)

    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await page.getByRole('button', { name: /editar intensidade — tipo da etapa 2/i }).click()
    await page.getByRole('radio', { name: 'Z5' }).click()

    // Sem duração, 1 km no ponto médio de 4:30-4:45/km dá 4:38, marcada como calculada
    const duracao = page.getByLabel('Duração (m:ss)').nth(1)
    await duracao.fill('')
    await page.getByLabel('Distância (km)').nth(1).fill('1')
    await expect(duracao).toHaveValue('4:38')
    await expect(page.getByText('calculado de distância × pace')).toBeVisible()

    await page.getByRole('button', { name: /^salvar$/i }).click()
    await expect.poll(() => patches.length).toBe(1)
    const tiro = (patches[0] as { etapas?: EtapaApi[] }).etapas?.find(e => e.tipoEtapa === 'INTERVALADO')
    expect(tiro).toMatchObject({ distanciaKm: 1, ritmoAlvo: '4:30-4:45/km' })
    expect(tiro).not.toHaveProperty('duracaoSeg')
    expect(tiro).not.toHaveProperty('duracaoMin')

    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await expect(page.getByLabel('Duração (m:ss)').nth(1)).toHaveValue('4:38')
  })

  test('atleta sem pace de limiar: o seletor preenche só a FC, avisa, e o PATCH não leva ritmoAlvo', async ({ page }) => {
    const patches = await mockarApis(page, ZONAS_SEM_PACE)
    await abrirEdicaoDoTreino(page)

    // A tabela do atleta sem pace renderiza (datas e pace null) e diz o que falta; o cadastro é
    // uma ação (botão que abre o diálogo), não navegação — daí nenhum link
    await page.getByRole('button', { name: /zonas de atleta/i }).click()
    await expect(page.getByText('Ritmo não cadastrado.')).toBeVisible()
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

  test('arrastar o desaquecimento para o topo: o PATCH leva as etapas na nova ordem e a série reabre inteira (coach-reordenar-etapas-dnd)', async ({ page }) => {
    // O gesto precisa das duas alças na viewport ao mesmo tempo: o conteúdo do dialog rola, e
    // `mouse.move` fora da tela não chega ao sensor.
    await page.setViewportSize({ width: 1280, height: 1600 })
    const patches = await mockarApis(page, ZONAS_COMPLETAS, ETAPAS_COM_BLOCO)
    await abrirEdicaoDoTreino(page)
    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await page.getByRole('button', { name: /ocultar gráfico/i }).click()

    // Ordem inicial: aquecimento (1), série (2), desaquecimento (3)
    await expect.poll(() => tiposPorRotulo(page, /^Tipo da etapa \d$/)).toEqual(['AQUECIMENTO', 'DESAQUECIMENTO'])
    await expect(page.getByTestId('resumo-serie-1')).toBeVisible()

    // O PointerSensor exige movimento real (distance: 4): mouse pressionado e arrastado em passos
    const alca = page.getByRole('button', { name: 'Arrastar etapa 3' })
    const destino = page.getByRole('button', { name: 'Arrastar etapa 1' })
    await alca.scrollIntoViewIfNeeded()
    await expect(destino).toBeInViewport()
    await expect(alca).toBeInViewport()
    const de = await alca.boundingBox()
    const para = await destino.boundingBox()
    if (!de || !para) throw new Error('alças sem geometria')
    await page.mouse.move(de.x + de.width / 2, de.y + de.height / 2)
    await page.mouse.down()
    await page.mouse.move(de.x + de.width / 2, de.y + de.height / 2 + 8, { steps: 2 })
    await page.mouse.move(para.x + para.width / 2, para.y - 8, { steps: 12 })
    await page.mouse.up()

    // Na tela: desaquecimento no topo, aquecimento em seguida, a série virou o terceiro item
    await expect.poll(() => tiposPorRotulo(page, /^Tipo da etapa \d$/)).toEqual(['DESAQUECIMENTO', 'AQUECIMENTO'])
    await expect(page.getByTestId('resumo-serie-2')).toBeVisible()

    // O dnd-kit segura um stopPropagation de clique no document por 50ms depois do drop
    // (AbstractPointerSensor.detach); um clique imediato em Salvar não chega ao React.
    await page.waitForTimeout(100)
    await page.getByRole('button', { name: /^salvar$/i }).click()
    await expect.poll(() => patches.length).toBe(1)
    const etapas = (patches[0] as { etapas?: EtapaApi[] }).etapas ?? []
    expect(etapas.map(e => e.tipoEtapa)).toEqual(['DESAQUECIMENTO', 'AQUECIMENTO', 'BLOCO'])
    expect(etapas[2]).toMatchObject({ blocoRepeticoes: 2 })
    expect(etapas[2].subEtapas?.map(e => e.tipoEtapa)).toEqual(['INTERVALADO', 'RECUPERACAO'])

    // Reaberto a partir do que foi gravado (expandido com blocoId), a série continua uma só, na nova posição
    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await expect.poll(() => tiposPorRotulo(page, /^Tipo da etapa \d$/)).toEqual(['DESAQUECIMENTO', 'AQUECIMENTO'])
    await expect(page.getByTestId('resumo-serie-2')).toBeVisible()
    await expect(page.getByTestId('repeticoes-display-2')).toHaveText('2×')
    await expect.poll(() => tiposPorRotulo(page, /^Tipo da etapa \d da série 3$/)).toEqual(['INTERVALADO', 'RECUPERACAO'])
  })
})
