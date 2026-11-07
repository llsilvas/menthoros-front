import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Lista principal do inbox — cobertura do gate da change `refine-inbox-visual-hierarchy`.
 *
 * **Por que este arquivo existe.** A change remove os previews "Fila de atenção" e "Roster do
 * dashboard". O risco não é o teste que quebra com a remoção — é o que continua **verde** enquanto
 * a tela regride: `useCoachDashboard.test` e `coachInboxAdapters.test` passam com o inbox vazio, e
 * os outros E2E de coach mockam a rota coringa de coach como lista vazia, então nunca renderizam
 * a lista de verdade.
 *
 * O que só aqui se prova: com um dashboard **de verdade**, um atleta em atenção que não está na
 * página corrente do roster continua alcançável — que é a função do módulo a ser removido.
 */

const INBOX_URL = '/#/coach/inbox'
const ME_API = '**/api/v1/users/me**'
const DASHBOARD_API = '**/api/v1/coach/dashboard*'

const ME = {
  id: 'coach-uuid',
  nome: 'Coach Teste',
  email: 'coach@teste.com',
  avatarUrl: null,
  assessoria: { id: 'tenant-uuid', nome: 'Corridas Serra' },
  lgpdConsentGranted: true,
  lgpdCurrentPolicyVersion: '2026-06-30',
  lgpdCurrentTermsVersion: '2026-06-30',
  lgpdAcceptedPolicyVersion: '2026-06-30',
  lgpdAcceptedTermsVersion: '2026-06-30',
  onboardingConcluido: true,
}

/** Atleta do roster: 10 por página, como o backend devolve. */
function atletaRoster(i: number, over: Record<string, unknown> = {}) {
  return {
    atletaId: `roster-${i}`,
    nome: `Atleta Roster ${i}`,
    status: 'active',
    weeklyVolume: 30 + i,
    aderenciaPercentual: 80,
    lastActivity: '2026-08-14',
    ...over,
  }
}

/**
 * `attentionQueue` NÃO é paginada — é a lista completa. É essa assimetria com o roster (10 por
 * página) que cria o risco que este spec cobre.
 */
const ANA_EM_ALERTA = {
  atletaId: 'ana-alerta',
  athleteName: 'Ana Fora da Pagina',
  severity: 'CRITICA',
  priorityScore: 90,
  primaryReason: 'INATIVIDADE',
  suggestedAction: 'Entrar em contato hoje',
  generatedAt: '2026-08-15T12:00:00Z',
  evidence: [],
}

async function mockarDashboard(
  page: Page,
  opcoes: { attentionQueue?: unknown[]; rosterExtra?: Record<string, unknown>[] } = {},
) {
  await page.route(ME_API, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ME) }),
  )

  await page.route(DASHBOARD_API, (route) => {
    const url = new URL(route.request().url())
    const pagina = Number.parseInt(url.searchParams.get('page') ?? '0', 10)
    const status = url.searchParams.get('status')
    const busca = (url.searchParams.get('q') ?? '').toLowerCase()

    let todos = [
      ...Array.from({ length: 10 }, (_, i) => atletaRoster(i + 1)),
      ...(opcoes.rosterExtra ?? []),
    ]
    if (status) todos = todos.filter((a) => a.status === status)
    if (busca) todos = todos.filter((a) => String(a.nome).toLowerCase().includes(busca))

    const totalElements = todos.length
    const items = todos.slice(pagina * 10, pagina * 10 + 10)

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        generatedAt: '2026-08-15T12:00:00Z',
        summary: {
          kpis: { totalAtletas: totalElements, ativos: totalElements, emAtencao: 1, treinosPlanejadosSemana: 12 },
          atletasExibidos: items.length,
          itensFilaAtencao: 1,
        },
        roster: { items, page: pagina, size: 10, totalElements, totalPages: Math.ceil(totalElements / 10) },
        attentionQueue: opcoes.attentionQueue ?? [ANA_EM_ALERTA],
      }),
    })
  })

  // Endpoints secundários do shell — silenciados para isolar o inbox.
  await page.route('**/api/v1/coach/planos/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route('**/api/v1/atletas/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  )
}

test.describe('Coach — lista principal do inbox', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['PROPRIETARIO', 'TECNICO'] })
  })

  /** O cenário do gate: quem precisa de atenção não pode depender de estar na página certa. */
  test('atleta em atenção fora do roster aparece com motivo e recência', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)

    const linha = page.getByRole('button', { name: /ana fora da pagina/i })
    await expect(linha).toBeVisible()
    // Fora do roster não há último treino: a recência é a idade do sinal, dita como tal.
    await expect(linha).toContainText(/inatividade · sinal há \d+ dias?/i)
  })

  test('navegar para a página 2 mantém o atleta em atenção e não altera o total', async ({ page }) => {
    await mockarDashboard(page, {
      rosterExtra: Array.from({ length: 5 }, (_, i) => atletaRoster(100 + i)),
    })
    await page.goto(INBOX_URL)

    // Escopado ao TablePagination: o header da lista também exibe "10 de 15", e um matcher solto
    // casaria com os dois. Rodapé em PT-BR (inbox-lista-triagem).
    const paginacao = page.locator('.MuiTablePagination-displayedRows')
    await expect(paginacao).toHaveText(/1–10 de 15/)
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()

    await page.getByRole('button', { name: 'Próxima página' }).click()

    // O fixado sobrevive à troca de página...
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()
    // ...e não entra na contagem: somá-lo faria "de 15" virar "de 16" e a última página vir curta.
    await expect(page.locator('.MuiTablePagination-displayedRows')).toHaveText(/11–15 de 15/)
  })

  test('atleta em atenção fora do filtro ativo é contado, não sumido', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()

    // Filtro segmentado no header da própria lista (inbox-lista-triagem): "Pausados" esconde quem
    // está em atenção mas não está pausado — e a tela diz quantos ficaram de fora.
    await page.getByRole('button', { name: /^Pausados$/ }).click()

    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toHaveCount(0)
    await expect(page.getByText(/em atenção fora do filtro atual/i)).toBeVisible()
  })

  test('atleta presente nas duas fontes não duplica', async ({ page }) => {
    await mockarDashboard(page, {
      attentionQueue: [{ ...ANA_EM_ALERTA, atletaId: 'roster-3', athleteName: 'Atleta Roster 3' }],
    })
    await page.goto(INBOX_URL)

    await expect(page.getByRole('button', { name: /atleta roster 3/i })).toHaveCount(1)
  })

  /**
   * Task 1.4: o card do roster passa a carregar o motivo. Antes, o coach via o estado ("Alerta")
   * sem o porquê e tinha de abrir cada atleta para descobrir — numa tela cujo job é triagem.
   */
  test('atleta do roster com sinal mostra o motivo no próprio card', async ({ page }) => {
    await mockarDashboard(page, {
      attentionQueue: [{ ...ANA_EM_ALERTA, atletaId: 'roster-3', athleteName: 'Atleta Roster 3', primaryReason: 'ADERENCIA' }],
    })
    await page.goto(INBOX_URL)

    // inbox-lista-triagem: a severidade saiu do texto (ficou na moldura e na cor); o motivo e a
    // recência são a linha de contexto, uma vez só.
    const card = page.getByRole('button', { name: /atleta roster 3/i })
    await expect(card).toContainText(/aderência · sinal há \d+ dias?/i)
    await expect(card.locator('.MuiChip-root')).toHaveCount(0)
  })

  test('clicar na linha de atenção abre o detalhe do atleta certo', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)

    await page.getByRole('button', { name: /ana fora da pagina/i }).click()

    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toHaveAttribute('aria-current', 'true')
  })

  /**
   * Task 1.6 — inversão chrome/conteúdo. A auditoria mediu o título estático da página como o maior
   * texto da tela (23,2px), acima de qualquer dado do atleta. Numa tela de triagem, quem tem de
   * dominar é o nome de quem está sendo triado.
   *
   * Esta é a parte **mecânica** do critério 5; a contagem de elementos em accent continua sendo
   * inspeção visual, porque `primary[500]` aparece em usos legítimos e ilegítimos no mesmo arquivo.
   */
  test('o nome do atleta é maior que o título da página', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)

    const tamanho = async (testId: string) => {
      const px = await page.getByTestId(testId).evaluate((el) => getComputedStyle(el).fontSize)
      return Number.parseFloat(px)
    }

    const titulo = await tamanho('inbox-titulo')
    const nome = await tamanho('inbox-nome-atleta')

    expect(nome).toBeGreaterThan(titulo)
    expect(titulo).toBeLessThanOrEqual(17)
  })

  /**
   * Tasks 1.2/1.3 — o CTA troca de ação conforme o estado, em vez de aparecer morto. Aqui o atleta
   * selecionado não tem plano em revisão (as rotas de plano devolvem vazio) mas tem sinal de
   * inatividade, então a ação primária tem de ser contatar — não um "Aprovar plano" cinza.
   */
  test('sem plano pendente e com inatividade, o CTA é contatar o atleta', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)

    await page.getByRole('button', { name: /ana fora da pagina/i }).click()

    const cta = page.getByTestId('inbox-cta-primario')
    await expect(cta).toBeVisible()
    await expect(cta).toHaveText(/contatar atleta/i)

    // Altura e fonte legíveis: o CTA antigo tinha 28px e 11,5px, no limite da dobra.
    const caixa = await cta.boundingBox()
    expect(caixa!.height).toBeGreaterThanOrEqual(40)
    const fonte = await cta.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
    expect(fonte).toBeGreaterThanOrEqual(14)
  })

  test('o CTA fica visível sem rolar a página', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)

    const cta = page.getByTestId('inbox-cta-primario')
    await expect(cta).toBeInViewport()
  })

  /**
   * Task 2.3 — fonte mínima. A auditoria reportou 7,2px como o menor texto; o código real tinha
   * **4,8px** (`0.30rem`). Abaixo de 11px o texto não é lido, é adivinhado.
   *
   * O teste percorre os nós de texto VISÍVEIS do inbox em vez de conferir alguns elementos
   * escolhidos a dedo — que é como uma regressão passa despercebida.
   */
  test('nenhum texto visível do inbox fica abaixo de 11px', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)
    await page.getByTestId('inbox-cta-primario').waitFor()

    const pequenos = await page.evaluate(() => {
      const fora: Array<{ texto: string; px: number }> = []
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const proprio = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent?.trim() ?? '')
          .join('')
        if (!proprio) continue
        const estilo = getComputedStyle(el)
        if (estilo.visibility === 'hidden' || estilo.display === 'none') continue
        const px = Number.parseFloat(estilo.fontSize)
        if (px < 11) fora.push({ texto: proprio.slice(0, 40), px })
      }
      return fora
    })

    expect(pequenos, `textos abaixo de 11px: ${JSON.stringify(pequenos)}`).toEqual([])
  })

  test('o inbox não rola horizontalmente em 1440x900', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)
    await page.getByTestId('inbox-cta-primario').waitFor()

    const estoura = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth)

    expect(estoura).toBe(false)
  })

  /**
   * Notebook de resolução menor — 1366×768 nativo, ou Full HD com escala de 125–150% do Windows,
   * que dá uma largura CSS de 1024–1280px e altura de ~650–720px. É a tela onde o coach de verdade
   * trabalha, e a que o layout menos considerava: abaixo de 1200px a grade virava coluna única num
   * container sem rolagem, e o detalhe do atleta ficava cortado; a sidebar seguia em 240px.
   *
   * Os tamanhos cobrem a faixa: 1366×768 (o notebook mais comum), 1280×720 e 1024×640. Verificam o
   * fluxo inteiro se mantendo — não regras de estilo isoladas. A sidebar só recolhe sozinha abaixo
   * de `lg` (1200px); acima disso a preferência do coach manda.
   */
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 1024, height: 640 }]) {
    const compacto = viewport.width < 1200
    test(`em notebook ${viewport.width}x${viewport.height}, lista e detalhe ficam lado a lado${compacto ? ' e a sidebar nasce recolhida' : ''}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await mockarDashboard(page)
      await page.goto(INBOX_URL)

      // Abaixo de 1200px a sidebar nasce recolhida — o espaço é do conteúdo.
      await expect(page.getByRole('button', { name: compacto ? /expandir sidebar/i : /recolher sidebar/i })).toBeVisible()

      const linha = page.getByRole('button', { name: /ana fora da pagina/i })
      await linha.click()
      const cta = page.getByTestId('inbox-cta-primario')
      await expect(cta).toBeInViewport()

      // Lado a lado: o detalhe começa à direita da lista, não abaixo dela.
      const caixaLinha = (await linha.boundingBox())!
      const caixaCta = (await cta.boundingBox())!
      expect(caixaCta.x).toBeGreaterThan(caixaLinha.x + caixaLinha.width)

      const estoura = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(estoura).toBe(false)
    })
  }

  /**
   * Task 2.7 — o insight estruturado no detalhe. O DTO da fila já trazia motivo, evidência,
   * `rationale` e `sourceRules`; a tela renderizava tudo isso amassado num texto livre.
   */
  test('o detalhe do atleta em atenção mostra o insight em seções', async ({ page }) => {
    await mockarDashboard(page, {
      attentionQueue: [{
        ...ANA_EM_ALERTA,
        primaryReason: 'ADERENCIA',
        evidence: [{ label: 'Aderência 4s', value: '62%' }],
        explanation: {
          rationale: 'Três treinos perdidos seguidos após aumento de carga.',
          sourceRules: ['adherence_drop'],
          confidence: 'HIGH',
        },
      }],
    })
    await page.goto(INBOX_URL)

    await page.getByRole('button', { name: /ana fora da pagina/i }).click()

    await expect(page.getByText(/por que importa/i)).toBeVisible()
    await expect(page.getByText(/três treinos perdidos/i)).toBeVisible()
    await expect(page.getByText('Aderência 4s')).toBeVisible()
    await expect(page.getByText(/adherence_drop/)).toBeVisible()
  })
})

/**
 * `fix-coach-inbox-suggestion-panel` — decidir uma sugestão pelo inbox. O backend persistia a
 * aprovação, mas o inbox não recarregava o perfil depois da decisão: a lista seguia "Pendente" até
 * recarregar a página, contradizendo a ação que o coach acabou de tomar.
 */
test.describe('Coach — decisão sobre sugestão pelo inbox', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['PROPRIETARIO', 'TECNICO'] })
  })

  test('aprovar uma sugestão atualiza a lista sem recarregar a página', async ({ page }) => {
    await mockarDashboard(page)

    let aprovada = false
    const detalhe = () => ({
      id: 'sug-1',
      atletaId: 'ana-alerta',
      athleteName: 'Ana Fora da Pagina',
      tipo: 'PLAN_ADJUST',
      status: aprovada ? 'APPROVED' : 'PENDING',
      confidence: 'MEDIUM',
      summary: 'Reduzir o volume do longão',
      reasoning: {
        rationale: 'Aderência caiu nas últimas duas semanas.',
        sourceRules: ['CoachAttentionSignalEvaluator.avaliarAderencia'],
        confidence: 'MEDIUM',
      },
      createdAt: '2026-08-15T12:00:00Z',
      expiresAt: '2026-08-22T12:00:00Z',
    })

    await page.route('**/api/v1/coach/atletas/*/perfil', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          atletaId: 'ana-alerta',
          nomeAtleta: 'Ana Fora da Pagina',
          objetivo: null,
          proximaProva: null,
          nivelExperiencia: null,
          pmc: [],
          aderenciaSemanal: [],
          planoVigente: null,
          sinaisRecentes: [],
          sugestoesRecentes: [
            { id: 'sug-1', tipo: 'AJUSTE_PLANO', status: aprovada ? 'APPROVED' : 'PENDING', criadoEm: '2026-08-15T12:00:00Z' },
          ],
          recordes: [],
          melhoresEsforcos: [],
          melhoresEsforcosIntegracaoConectada: true,
          geradoEm: '2026-08-15T12:00:00Z',
          avisos: null,
        }),
      }),
    )
    await page.route(/\/api\/v1\/coach\/sugestoes\/sug-1$/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detalhe()) }),
    )
    await page.route('**/api/v1/coach/sugestoes/sug-1/aprovar', (route) => {
      aprovada = true
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detalhe()) })
    })

    await page.goto(INBOX_URL)
    await page.getByRole('button', { name: /ana fora da pagina/i }).click()
    await page.getByRole('tab', { name: /provas & sugestões/i }).click()

    await expect(page.getByText('Pendente')).toBeVisible()

    await page.getByRole('button', { name: /^ver$/i }).click()
    const dialog = page.getByRole('dialog')
    // CA4: rótulos do coach, sem o nome interno das regras.
    await expect(dialog.getByText('Ajuste de plano')).toBeVisible()
    await expect(dialog.getByText(/CoachAttentionSignalEvaluator/)).toHaveCount(0)

    const perfilRecarregado = page.waitForRequest('**/api/v1/coach/atletas/*/perfil')
    await dialog.getByRole('button', { name: /^aprovar$/i }).click()
    await perfilRecarregado
    await dialog.getByRole('button', { name: /^fechar$/i }).first().click()
    await expect(dialog).toBeHidden()

    await expect(page.getByText('Aprovada')).toBeVisible()
    await expect(page.getByText('Pendente')).toHaveCount(0)
  })
})

/**
 * inbox-barra-unica-sem-rodape — os dois achados críticos da crítica de design de 2026-11-07:
 * o cabeçalho + faixa de KPIs (~136px) viram uma barra, e o rodapé de ações simuladas sai, com
 * "Ajustar plano" no cabeçalho do atleta. Medido no viewport real de notebook (1366×625), não em
 * 1366×768, que nenhum navegador entrega nessa tela.
 */
function perfilDe(atletaId: string, nome: string, planoVigente: Record<string, unknown> | null) {
  return {
    atletaId,
    nomeAtleta: nome,
    objetivo: null,
    proximaProva: null,
    nivelExperiencia: null,
    pmc: [],
    aderenciaSemanal: [],
    planoVigente,
    sinaisRecentes: [],
    sugestoesRecentes: [],
    recordes: [],
    melhoresEsforcos: [],
    melhoresEsforcosIntegracaoConectada: true,
    geradoEm: '2026-08-15T12:00:00Z',
    avisos: null,
  }
}

test.describe('Coach — barra única e rodapé fora (inbox-barra-unica-sem-rodape)', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['PROPRIETARIO', 'TECNICO'] })
  })

  test('o topo é uma barra de até 56px e "em atenção" conta a fila, não o resumo', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 625 })
    // `resumo.emAtencao` fica em 1 (mock padrão) enquanto a fila tem três: a barra segue a fila.
    await mockarDashboard(page, {
      attentionQueue: [
        ANA_EM_ALERTA,
        { ...ANA_EM_ALERTA, atletaId: 'roster-2', athleteName: 'Atleta Roster 2', primaryReason: 'SOBRECARGA' },
        { ...ANA_EM_ALERTA, atletaId: 'roster-5', athleteName: 'Atleta Roster 5', severity: 'MEDIA', primaryReason: 'ADERENCIA' },
      ],
    })
    await page.goto(INBOX_URL)
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()

    await expect(page.getByTestId('inbox-titulo')).toHaveText('Inbox')
    await expect(page.getByTestId('inbox-resumo-atencao')).toHaveText(/3 em atenção/)
    await expect(page.getByTestId('inbox-kpi-ativos')).toHaveCount(0)
    await expect(page.getByText(/Assistente do Treinador/i)).toHaveCount(0)
    await expect(page.getByText(/Atletas exibidos/i)).toHaveCount(0)

    const barra = (await page.getByTestId('inbox-barra').boundingBox())!
    expect(barra.height).toBeLessThanOrEqual(56)
  })

  test('em 900px (início de md, sidebar recolhida) a barra continua numa linha com resumo e busca', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 })
    await mockarDashboard(page)
    await page.goto(INBOX_URL)
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()

    await expect(page.getByTestId('inbox-resumo-atualizado')).toBeVisible()
    await expect(page.getByPlaceholder('Buscar atleta...')).toBeVisible()
    const barra = (await page.getByTestId('inbox-barra').boundingBox())!
    expect(barra.height).toBeLessThanOrEqual(56)
  })

  test('sem rodapé; "Ajustar plano" no cabeçalho abre a aba Plano; detalhe com ≥ 45% da altura em 1366×625', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 625 })
    await mockarDashboard(page)
    await page.route('**/api/v1/coach/atletas/*/perfil', (route) =>
      route.fulfill({ json: perfilDe('ana-alerta', 'Ana Fora da Pagina', null) }),
    )
    await page.goto(INBOX_URL)
    await page.getByRole('button', { name: /ana fora da pagina/i }).click()
    await expect(page.getByTestId('inbox-cta-primario')).toHaveText(/contatar atleta/i)

    await expect(page.getByRole('button', { name: /enviar mensagem/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /mais ações/i })).toHaveCount(0)

    const ajustar = page.getByRole('button', { name: /ajustar plano/i })
    await expect(ajustar).toBeInViewport({ ratio: 1 })
    await ajustar.click()
    await expect(page.getByRole('tab', { name: /^Plano$/i })).toHaveAttribute('aria-selected', 'true')

    const conteudo = (await page.getByTestId('inbox-detalhe-conteudo').boundingBox())!
    expect(conteudo.height / 625).toBeGreaterThanOrEqual(0.45)
  })

  test('1093×500 com plano aguardando revisão e nome longo: Aprovar, Rejeitar e Ajustar plano inteiros na tela', async ({ page }) => {
    await page.setViewportSize({ width: 1093, height: 500 })
    const nomeLongo = 'Maria Aparecida Nascimento de Oliveira'
    await mockarDashboard(page, {
      attentionQueue: [{ ...ANA_EM_ALERTA, atletaId: 'maria-longa', athleteName: nomeLongo }],
    })
    await page.route('**/api/v1/coach/atletas/*/perfil', (route) =>
      route.fulfill({
        json: perfilDe('maria-longa', nomeLongo, {
          planoId: '11111111-1111-1111-1111-111111111111',
          semanaInicio: '2026-08-17',
          semanaFim: '2026-08-23',
          reviewStatus: 'AGUARDANDO_REVISAO',
          treinos: [],
        }),
      }),
    )
    await page.goto(INBOX_URL)
    await page.getByRole('button', { name: new RegExp(nomeLongo, 'i') }).click()

    const cta = page.getByTestId('inbox-cta-primario')
    await expect(cta).toHaveText(/aprovar plano/i)
    await expect(cta).toBeInViewport({ ratio: 1 })
    await expect(page.getByRole('button', { name: /^Rejeitar$/i })).toBeInViewport({ ratio: 1 })
    await expect(page.getByRole('button', { name: /ajustar plano/i })).toBeInViewport({ ratio: 1 })

    const conteudo = (await page.getByTestId('inbox-detalhe-conteudo').boundingBox())!
    expect(conteudo.height / 500).toBeGreaterThanOrEqual(0.4)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  })
})

/**
 * inbox-lista-triagem — a coluna da lista como ferramenta de triagem: linha densa, "Em atenção"
 * como visão da fila inteira, busca junto da lista, paginação em PT-BR.
 */
test.describe('Coach — lista de triagem (inbox-lista-triagem)', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['PROPRIETARIO', 'TECNICO'] })
  })

  const TRES_EM_ATENCAO = [
    ANA_EM_ALERTA,
    { ...ANA_EM_ALERTA, atletaId: 'roster-2', athleteName: 'Atleta Roster 2', primaryReason: 'SOBRECARGA', severity: 'ALTA' },
    { ...ANA_EM_ALERTA, atletaId: 'roster-12', athleteName: 'Atleta Roster 12', primaryReason: 'ADERENCIA', severity: 'MEDIA' },
  ]

  test('1366×625: pelo menos 6 linhas inteiras na lista, cada uma com até 52px, e a busca no header da coluna', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 625 })
    await mockarDashboard(page, { attentionQueue: TRES_EM_ATENCAO, rosterExtra: Array.from({ length: 5 }, (_, i) => atletaRoster(11 + i)) })
    await page.goto(INBOX_URL)
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()

    const header = page.getByTestId('inbox-lista-header')
    await expect(header.getByPlaceholder('Buscar atleta...')).toBeVisible()
    await expect(page.getByTestId('inbox-barra').getByPlaceholder('Buscar atleta...')).toHaveCount(0)

    const lista = page.getByTestId('inbox-lista')
    const caixaLista = (await lista.boundingBox())!
    const linhas = await lista.getByRole('button').all()
    let inteiras = 0
    for (const linha of linhas) {
      const caixa = (await linha.boundingBox())!
      expect(caixa.height).toBeLessThanOrEqual(52)
      if (caixa.y >= caixaLista.y && caixa.y + caixa.height <= caixaLista.y + caixaLista.height) inteiras += 1
    }
    expect(inteiras).toBeGreaterThanOrEqual(6)
  })

  test('linha com sinal diz o motivo uma vez, sem chip; sem aderência no roster, "—"', async ({ page }) => {
    await mockarDashboard(page, {
      attentionQueue: [{ ...ANA_EM_ALERTA, atletaId: 'roster-2', athleteName: 'Atleta Roster 2', primaryReason: 'SOBRECARGA' }],
      rosterExtra: [atletaRoster(99, { aderenciaPercentual: undefined })],
    })
    await page.goto(INBOX_URL)

    const linha = page.getByRole('button', { name: /atleta roster 2/i })
    await expect(linha).toContainText(/sobrecarga · sinal há \d+ dias?/i)
    await expect(linha.getByText(/alerta/i)).toHaveCount(0)
    await expect(linha.locator('.MuiChip-root')).toHaveCount(0)
    await expect(linha.locator('.MuiLinearProgress-root')).toHaveCount(0)

    // O extra cai na página 2 (o mock pagina de 10 em 10).
    await page.getByRole('button', { name: 'Próxima página' }).click()
    await expect(page.getByRole('button', { name: /atleta roster 99/i }).getByTestId('queue-row-aderencia')).toHaveText('—')
  })

  test('"Em atenção" da página 2 mostra a fila inteira sem paginação; "Todos" devolve a página 2', async ({ page }) => {
    await mockarDashboard(page, { attentionQueue: TRES_EM_ATENCAO, rosterExtra: Array.from({ length: 5 }, (_, i) => atletaRoster(11 + i)) })
    await page.goto(INBOX_URL)
    await page.getByRole('button', { name: 'Próxima página' }).click()
    await expect(page.locator('.MuiTablePagination-displayedRows')).toHaveText(/11–15 de 15/)

    await page.getByRole('button', { name: /^Em atenção/ }).click()

    await expect(page).toHaveURL(/status=attention/)
    await expect(page.getByTestId('inbox-lista-contagem')).toHaveText(/3 em atenção/)
    await expect(page.getByTestId('inbox-lista').getByRole('button')).toHaveCount(3)
    await expect(page.getByRole('button', { name: /atleta roster 12/i })).toBeVisible()
    await expect(page.locator('.MuiTablePagination-root')).toHaveCount(0)

    await page.getByRole('button', { name: /^Todos/ }).click()
    await expect(page.locator('.MuiTablePagination-displayedRows')).toHaveText(/11–15 de 15/)
  })

  test('com uma página só, não há rodapé de paginação', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()
    await expect(page.locator('.MuiTablePagination-root')).toHaveCount(0)
    await expect(page.getByTestId('inbox-lista-contagem')).toHaveText(/10 de 10/)
  })
})

/**
 * inbox-proximo-em-atencao — fluxo de triagem: "Próximo em atenção →" ao fim do Diagnóstico, tecla
 * `N`, setas na lista, e prova no cabeçalho só quando existe.
 */
test.describe('Coach — próximo em atenção e atalhos (inbox-proximo-em-atencao)', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['PROPRIETARIO', 'TECNICO'] })
  })

  const FILA_ABC = [
    { ...ANA_EM_ALERTA, atletaId: 'q-a', athleteName: 'Alice Atenta', severity: 'CRITICA' },
    { ...ANA_EM_ALERTA, atletaId: 'q-b', athleteName: 'Bento Souza', severity: 'ALTA', primaryReason: 'SOBRECARGA' },
    { ...ANA_EM_ALERTA, atletaId: 'q-c', athleteName: 'Clara Atenta', severity: 'MEDIA', primaryReason: 'ADERENCIA' },
  ]
  const linha = (page: Page, nome: RegExp) => page.getByTestId('inbox-lista').getByRole('button', { name: nome })
  /** O perfil ecoa o id da URL: a página descarta perfil de outro atleta como "ainda carregando". */
  const idDaUrl = (url: string) => /atletas\/([^/]+)\/perfil/.exec(url)?.[1] ?? 'x'

  test('o link e a tecla N percorrem a fila até "Fim da fila de atenção"; a busca pula quem está escondido', async ({ page }) => {
    await mockarDashboard(page, { attentionQueue: FILA_ABC })
    await page.route('**/api/v1/coach/atletas/*/perfil', (route) => route.fulfill({ json: perfilDe(idDaUrl(route.request().url()), 'Atleta', null) }))
    await page.goto(INBOX_URL)
    await expect(linha(page, /alice atenta/i)).toHaveAttribute('aria-current', 'true')

    await page.getByRole('button', { name: /próximo em atenção · bento souza/i }).click()
    await expect(linha(page, /bento souza/i)).toHaveAttribute('aria-current', 'true')

    await page.keyboard.press('n')
    await expect(linha(page, /clara atenta/i)).toHaveAttribute('aria-current', 'true')
    await expect(page.getByText(/fim da fila de atenção/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /próximo em atenção/i })).toHaveCount(0)

    // Busca "atent" esconde Bento Souza: de Alice o próximo é Clara.
    await linha(page, /alice atenta/i).click()
    await page.getByPlaceholder('Buscar atleta...').fill('atent')
    await expect(linha(page, /bento souza/i)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /próximo em atenção · clara atenta/i })).toBeVisible()
  })

  test('N não age dentro da busca nem com o dialog de rejeição aberto; ↓ troca a seleção', async ({ page }) => {
    await mockarDashboard(page, { attentionQueue: FILA_ABC })
    await page.route('**/api/v1/coach/atletas/*/perfil', (route) =>
      route.fulfill({
        json: perfilDe(idDaUrl(route.request().url()), 'Atleta', {
          planoId: '11111111-1111-1111-1111-111111111111',
          semanaInicio: '2026-08-17',
          semanaFim: '2026-08-23',
          reviewStatus: 'AGUARDANDO_REVISAO',
          treinos: [],
        }),
      }),
    )
    await page.goto(INBOX_URL)
    await expect(linha(page, /alice atenta/i)).toHaveAttribute('aria-current', 'true')

    await page.getByPlaceholder('Buscar atleta...').click()
    await page.keyboard.press('n')
    await expect(linha(page, /alice atenta/i)).toHaveAttribute('aria-current', 'true')
    await page.getByPlaceholder('Buscar atleta...').clear()

    await page.getByRole('button', { name: /^Rejeitar$/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('n')
    await page.getByRole('button', { name: /^Cancelar$/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(linha(page, /alice atenta/i)).toHaveAttribute('aria-current', 'true')

    await linha(page, /alice atenta/i).focus()
    await page.keyboard.press('ArrowDown')
    await expect(linha(page, /bento souza/i)).toBeFocused()
    await expect(linha(page, /bento souza/i)).toHaveAttribute('aria-current', 'true')
  })

  test('sem prova cadastrada, nada ocupa o lugar da próxima prova no cabeçalho', async ({ page }) => {
    await mockarDashboard(page)
    await page.route('**/api/v1/coach/atletas/*/perfil', (route) => route.fulfill({ json: perfilDe('ana-alerta', 'Ana Fora da Pagina', null) }))
    await page.goto(INBOX_URL)
    await page.getByRole('button', { name: /ana fora da pagina/i }).click()
    await expect(page.getByTestId('inbox-cta-primario')).toBeVisible()

    await expect(page.getByTestId('inbox-proxima-prova')).toHaveCount(0)
    await expect(page.getByText(/sem prova cadastrada/i)).toHaveCount(0)
  })
})
