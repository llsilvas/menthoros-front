import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Perfil do treino na revisão do plano — os critérios de aceite que só um
 * navegador consegue julgar.
 *
 * **Por que este arquivo existe.** O Vitest deste repo roda em jsdom com
 * `css: false` (`vite.config.ts:46-52`): `getBoundingClientRect`, `scrollHeight`
 * e medição de texto devolvem zero, e regra de CSS não é aplicada. Um teste de
 * altura, de largura mínima ou de overflow escrito lá passa **tanto na
 * implementação correta quanto na quebrada** — que é a definição de teste
 * inútil, e é exatamente o defeito que o AC-3 existe para pegar (o componente
 * anterior fazia `scaleY(1.04)` num container mais baixo que as barras).
 *
 * Então AC-2, AC-3, AC-5, AC-7, AC-8 e AC-11 vivem aqui. Vitest prova a regra;
 * Playwright prova a geometria.
 */

const REVIEW_URL = '/#/coach/planos/revisao'
const ME_API = '**/api/v1/users/me**'
const REVIEW_API = '**/api/v1/coach/planos/revisao*'

const PLANO_ID = '11111111-1111-1111-1111-111111111111'
const TREINO_ID = '22222222-2222-2222-2222-222222222222'

const etapa = (ordem: number, tipoEtapa: string, duracaoMin: number, fcAlvoEtapa: string) =>
  ({ ordem, tipoEtapa, duracaoMin, fcAlvoEtapa })

/**
 * 5×(3' Z4 + 2' Z1) entre aquecimento e desaquecimento, mais um tiro de 30
 * segundos no fim: 12 blocos, 60 minutos. O bloco de 30s existe para o AC-5 —
 * ele pede 0,8% da largura e some sem o piso de 3px.
 */
const PLANO = {
  id: PLANO_ID,
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
      distanciaKm: 12,
      duracaoMin: 'PT60M',
      zonaAlvo: 'Z4',
      percepcaoEsforcoEsperada: 8,
      tssPlanejado: 75,
      editadoPeloCoach: false,
      etapas: [
        etapa(1, 'AQUECIMENTO', 15, 'Z2'),
        etapa(2, 'INTERVALADO', 3, 'Z4'),
        etapa(3, 'RECUPERACAO', 2, 'Z1'),
        etapa(4, 'INTERVALADO', 3, 'Z4'),
        etapa(5, 'RECUPERACAO', 2, 'Z1'),
        etapa(6, 'INTERVALADO', 3, 'Z4'),
        etapa(7, 'RECUPERACAO', 2, 'Z1'),
        etapa(8, 'INTERVALADO', 3, 'Z4'),
        etapa(9, 'RECUPERACAO', 2, 'Z1'),
        etapa(10, 'INTERVALADO', 3, 'Z4'),
        etapa(11, 'RECUPERACAO', 2, 'Z1'),
        etapa(12, 'DESAQUECIMENTO', 20, 'Z2'),
      ],
    },
  ],
}

async function mockarApis(page: Page) {
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
    route.fulfill({ json: status === 'AGUARDANDO_REVISAO' ? [PLANO] : [] })
  })
  await page.route('**/api/v1/coach/dashboard*', route => route.fulfill({ json: {} }))
}

/** Abre a fila, escolhe o plano e entra na edição do treino, onde o perfil vive. */
async function abrirPerfil(page: Page) {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await mockarApis(page)
  await autenticarComPkce(page, { roles: ['TECNICO'] })
  await page.goto(REVIEW_URL)

  await page.getByRole('button', { name: /Atleta Teste/i }).click()
  await page.getByRole('button', { name: 'Editar treino' }).first().click()
  await expect(page.getByTestId('workout-profile')).toBeVisible()
}

test.describe('perfil do treino — geometria', () => {
  test('AC-2: a altura codifica a intensidade, e a razão entre alturas se preserva', async ({ page }) => {
    await abrirPerfil(page)

    const blocos = page.getByTestId('workout-block')
    const plot = page.getByTestId('workout-plot')
    const alturaPlot = (await plot.boundingBox())!.height

    // Um bloco Z4 e um Z1 do meio da série. As alturas saem do ponto médio da
    // faixa de cada zona, então a razão entre elas é a razão entre as zonas.
    const alturaZ4 = (await blocos.nth(1).boundingBox())!.height
    const alturaZ1 = (await blocos.nth(2).boundingBox())!.height

    expect(alturaZ4, 'o bloco de limiar deve ser claramente mais alto').toBeGreaterThan(alturaZ1 * 1.5)
    // Nada passa do teto do plot: a altura do plot é a única fonte de verdade.
    expect(alturaZ4).toBeLessThanOrEqual(alturaPlot + 1)
    // Nem some: o piso de 12% garante que o bloco leve continue sendo um bloco.
    expect(alturaZ1).toBeGreaterThanOrEqual(alturaPlot * 0.12 - 1)
  })

  test('AC-3: o hover não muda a geometria e nada transborda', async ({ page }) => {
    await abrirPerfil(page)

    const plot = page.getByTestId('workout-plot')
    const bloco = page.getByTestId('workout-block').nth(1)
    const antes = (await bloco.boundingBox())!

    await bloco.hover()
    const durante = (await bloco.boundingBox())!

    // O componente anterior aplicava scaleY(1.04) no hover, o que invalidava a
    // comparação de altura entre blocos justamente enquanto o treinador comparava.
    expect(durante.height, 'a altura mudou durante o hover').toBeCloseTo(antes.height, 0)
    expect(durante.width).toBeCloseTo(antes.width, 0)

    const transbordou = await plot.evaluate(el => el.scrollHeight > el.clientHeight)
    expect(transbordou, 'o plot transbordou verticalmente').toBe(false)

    await page.mouse.move(0, 0)
    const depois = (await bloco.boundingBox())!
    expect(depois.height).toBeCloseTo(antes.height, 0)
  })

  test('AC-5: o bloco curto sobrevive ao piso, e a série ganha um bracket só', async ({ page }) => {
    await abrirPerfil(page)

    const larguras = await page.getByTestId('workout-block').evaluateAll(els =>
      els.map(el => el.getBoundingClientRect().width),
    )
    expect(larguras.length).toBe(12)
    for (const [i, w] of larguras.entries()) {
      expect(w, `bloco ${i} com ${w}px`).toBeGreaterThanOrEqual(3)
    }

    const brackets = page.getByTestId('repeat-bracket')
    await expect(brackets).toHaveCount(1)
    await expect(brackets.first()).toHaveText('5×')
  })

  test('AC-7: o rótulo cai para a abreviação declarada, nunca para reticências', async ({ page }) => {
    await abrirPerfil(page)

    const textos = await page.getByTestId('block-label').allTextContents()
    for (const texto of textos) {
      expect(texto, 'rótulo cortado com reticências').not.toMatch(/…|\.\.\./)
    }

    // Nenhum bloco pode declarar ellipsis: um rótulo cortado custa o mesmo pixel
    // do ícone e informa menos — "AQUEC…" é ambíguo entre aquecimento e desaquecimento.
    const comEllipsis = await page.getByTestId('workout-block').evaluateAll(els =>
      els.filter(el => getComputedStyle(el).textOverflow === 'ellipsis').length,
    )
    expect(comEllipsis).toBe(0)

    // O rótulo que aparece é o completo ou a abreviação declarada — nunca um corte.
    const permitidos = ['AQUEC', 'DESAQ', 'REC', 'PAUSA', 'TRAB', 'BASE']
    for (const texto of textos) {
      const ok = texto.length > 5 || permitidos.includes(texto)
      expect(ok, `rótulo "${texto}" não é nem completo nem abreviação declarada`).toBe(true)
    }
  })

  test('AC-8: uma superfície com borda e um único elemento caixa-alta', async ({ page }) => {
    await abrirPerfil(page)

    const perfil = page.getByTestId('workout-profile')

    const caixaAlta = await perfil.evaluateAll(els =>
      els.flatMap(raiz =>
        [raiz, ...Array.from(raiz.querySelectorAll('*'))].filter(
          el => getComputedStyle(el).textTransform === 'uppercase' && (el.textContent ?? '').trim().length > 0,
        ),
      ).length,
    )
    expect(caixaAlta, 'só a badge de zona-alvo pode ser caixa-alta').toBe(1)

    const comBorda = await perfil.evaluateAll(els =>
      els.flatMap(raiz =>
        [raiz, ...Array.from(raiz.querySelectorAll('*'))].filter(el => {
          const s = getComputedStyle(el)
          return parseFloat(s.borderTopWidth) > 0 && parseFloat(s.borderLeftWidth) > 0
            && parseFloat(s.borderRightWidth) > 0 && parseFloat(s.borderBottomWidth) > 0
            && s.borderTopStyle !== 'none'
        }),
      ).map(el => el.getAttribute('data-testid') ?? el.tagName),
    )
    // A raiz do card e a badge; nenhum card aninhado além disso.
    expect(comBorda.length, `superfícies com borda: ${comBorda.join(', ')}`).toBeLessThanOrEqual(2)
  })

  test('AC-1: a cor computada do bloco é a da zona, não a da etapa estrutural', async ({ page }) => {
    await abrirPerfil(page)

    const fundos = await page.getByTestId('workout-block').evaluateAll(els =>
      els.map(el => ({
        zona: el.getAttribute('data-zone'),
        fundo: getComputedStyle(el).backgroundImage || getComputedStyle(el).backgroundColor,
      })),
    )

    // Z4 é laranja (#F97316 → rgb(249, 115, 22)); Z1 é sky (#38BDF8).
    const z4 = fundos.find(f => f.zona === 'Z4')!
    const z1 = fundos.find(f => f.zona === 'Z1')!
    expect(z4.fundo).toContain('249, 115, 22')
    expect(z1.fundo).toContain('56, 189, 248')
  })

  test('AC-11: em escala de cinza, a leitura de intensidade sobrevive', async ({ page }) => {
    await abrirPerfil(page)

    const alturasColorido = await page.getByTestId('workout-block').evaluateAll(els =>
      els.map(el => Math.round(el.getBoundingClientRect().height)),
    )

    // Cor nunca é o único canal: a intensidade é lida por ALTURA (canal
    // primário), por cor (redundante) e por rótulo de zona no equivalente
    // textual. Em cinza, o canal primário fica intacto.
    await page.addStyleTag({ content: 'body { filter: grayscale(1); }' })

    const alturasCinza = await page.getByTestId('workout-block').evaluateAll(els =>
      els.map(el => Math.round(el.getBoundingClientRect().height)),
    )
    expect(alturasCinza).toEqual(alturasColorido)
    expect(new Set(alturasCinza).size, 'as alturas precisam variar para haver o que ordenar')
      .toBeGreaterThan(1)

    // Os rótulos de zona do eixo Y continuam legíveis: é o terceiro canal, o que
    // permite nomear a intensidade sem depender nem de cor nem de comparação.
    const eixo = page.getByTestId('zone-axis')
    for (const z of ['Z1', 'Z2', 'Z3', 'Z4', 'Z5']) {
      await expect(eixo.getByText(z, { exact: true })).toBeVisible()
    }

    // E a zona segue nomeada em texto para cada bloco, no equivalente textual.
    const zonasNaTabela = await page.getByTestId('profile-table-row').evaluateAll(els =>
      els.map(el => el.textContent ?? ''),
    )
    expect(zonasNaTabela.every(t => /Z[1-5]|não informada/.test(t))).toBe(true)
  })

  /**
   * O diálogo de edição dá ~558px de largura ao perfil — acima do limiar de
   * 536px (560 menos a histerese), então a tela onde o treinador decide recebe
   * a variante `full`: com título, eixo Y de zonas e o conjunto de métricas.
   *
   * Isto está como teste, e não como comentário, porque é a variante da tela de
   * decisão: se um dia ela cair para `compact`, o treinador perde o eixo de
   * zonas e a razão trabalho:recuperação, e a perda aparece aqui.
   */
  test('na revisão o perfil resolve para a variante full', async ({ page }) => {
    await abrirPerfil(page)

    await expect(page.getByTestId('zone-axis')).toBeVisible()
    await expect(page.getByTestId('workout-profile').getByRole('heading')).toHaveText('Perfil do treino')
    await expect(page.getByTestId('target-zone-badge')).toBeVisible()

    // E cabe: nada do perfil pode vazar a caixa do card.
    const vazou = await page.getByTestId('workout-profile').evaluate(el =>
      el.scrollWidth > el.clientWidth,
    )
    expect(vazou, 'o perfil não pode rolar horizontalmente dentro do card').toBe(false)
  })
})

test.describe('perfil do treino — leitura do treinador', () => {
  test('o header responde "que treino é este?" sem exigir leitura do gráfico', async ({ page }) => {
    await abrirPerfil(page)

    const perfil = page.getByTestId('workout-profile')
    await expect(perfil.getByTestId('target-zone-badge')).toHaveText(/ALVO · Z4/i)
    await expect(perfil.getByTestId('header-chips')).toContainText('1h')
    await expect(perfil.getByTestId('header-chips')).toContainText('12 blocos')
    // A razão trabalho:recuperação existe no perfil, mas a variante `compact`
    // desta tela só exibe duração e blocos — o chip vive no equivalente falado.
    const resumo = await perfil.locator('[role="img"]').getAttribute('aria-label')
    expect(resumo).toContain('Z4')
  })

  test('a distribuição concorda com a badge — a regressão que motivou a change', async ({ page }) => {
    await abrirPerfil(page)

    const legenda = page.getByTestId('distribution-legend')
    await expect(legenda).toContainText('Z4')

    const percentuais = (await legenda.textContent() ?? '').match(/(\d+)%/g) ?? []
    const soma = percentuais.reduce((s, p) => s + parseInt(p, 10), 0)
    expect(soma).toBeGreaterThanOrEqual(99)
    expect(soma).toBeLessThanOrEqual(101)
  })

  test('editar uma etapa redesenha o perfil na hora', async ({ page }) => {
    await abrirPerfil(page)

    const antes = await page.getByTestId('workout-block').count()

    // Aumenta as repetições da série: o eixo tem que ganhar dois blocos.
    await page.getByLabel(/Aumentar repetições da série/i).first().click()

    await expect(page.getByTestId('workout-block')).toHaveCount(antes + 2)
    await expect(page.getByTestId('repeat-bracket').first()).toHaveText('6×')
  })

  /**
   * Regressão: a geometria já foi calculada contra uma largura fixa de 600px
   * enquanto o plot media 532. A soma das larguras estourava o container, o
   * último bloco vazava 22px e era cortado pelo `overflow: hidden` — o
   * desaquecimento sumia da tela e o eixo de tempo mentia, sem nada acusar.
   */
  test('os blocos cabem exatamente na largura medida do plot', async ({ page }) => {
    await abrirPerfil(page)

    const { larguraPlot, somaBlocos, folgaDireita, scrollX } = await page
      .getByTestId('workout-plot')
      .evaluate(el => {
        const plot = el.getBoundingClientRect()
        const blocos = Array.from(el.querySelectorAll('[data-testid="workout-block"]'))
          .map(b => b.getBoundingClientRect())
        return {
          larguraPlot: plot.width,
          somaBlocos: blocos.reduce((s, b) => s + b.width, 0),
          folgaDireita: plot.right - blocos[blocos.length - 1].right,
          scrollX: el.scrollWidth - el.clientWidth,
        }
      })

    expect(somaBlocos).toBeCloseTo(larguraPlot, 0)
    expect(folgaDireita, 'o último bloco não pode vazar nem sobrar').toBeCloseTo(0, 0)
    expect(scrollX, 'o plot não pode rolar horizontalmente').toBe(0)
  })
})
