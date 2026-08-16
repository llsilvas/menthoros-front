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
        resumo: { totalAtletas: totalElements, ativos: totalElements, emAtencao: 1, treinosPlanejadosSemana: 12 },
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
    await expect(linha).toContainText(/inatividade/i)
    await expect(linha).toContainText(/\d+d/)
  })

  test('navegar para a página 2 mantém o atleta em atenção e não altera o total', async ({ page }) => {
    await mockarDashboard(page, {
      rosterExtra: Array.from({ length: 5 }, (_, i) => atletaRoster(100 + i)),
    })
    await page.goto(INBOX_URL)

    // O `TablePagination` não é localizado: o rótulo de linhas exibidas sai em inglês ("of 15").
    const total = page.getByText(/of 15|de 15/i)
    await expect(total).toBeVisible()
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()

    await page.getByRole('button', { name: 'Go to next page' }).click()

    // O fixado sobrevive à troca de página...
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()
    // ...e não entra na contagem: somá-lo faria "of 15" virar "of 16" e a última página vir curta.
    await expect(page.getByText(/of 15/i)).toBeVisible()
  })

  test('atleta em atenção fora do filtro ativo é contado, não sumido', async ({ page }) => {
    await mockarDashboard(page)
    await page.goto(INBOX_URL)
    await expect(page.getByRole('button', { name: /ana fora da pagina/i })).toBeVisible()

    // O `Select` de status não tem label associado (o texto "Status" é um Typography solto), então
    // a busca é pelo combobox. Corrigir a a11y disso é escopo da fase 2, não deste gate.
    await page.getByRole('combobox').filter({ hasText: 'Todos' }).click()
    await page.getByRole('option', { name: 'Atenção', exact: true }).click()

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

    const card = page.getByRole('button', { name: /atleta roster 3/i })
    await expect(card).toContainText(/alerta/i)
    await expect(card).toContainText(/aderência/i)
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
})
