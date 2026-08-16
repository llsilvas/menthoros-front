import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Wizard de boas-vindas — o gate que decide se o coach vê o produto ou a tela de onboarding.
 *
 * O que só aqui se prova: a precedência real entre consentimento, wizard e dashboard sob o router
 * de verdade, e que **concluir persiste** — o segundo carregamento não pode remontar o wizard.
 */

const INBOX_URL = '/#/coach/inbox'
const ME_API = '**/api/v1/users/me**'
const CONCLUIR_API = '**/api/v1/users/me/onboarding/concluir'
const ASSESSORIA_API = '**/api/v1/assessorias/me'
const ATLETAS_API = '**/api/v1/atletas'

const BASE_ME = {
  id: 'coach-uuid',
  nome: 'Coach Novo',
  email: 'novo@teste.com',
  avatarUrl: null,
  assessoria: { id: 'tenant-uuid', nome: 'Corridas Serra' },
  lgpdConsentGranted: true,
  lgpdCurrentPolicyVersion: '2026-06-30',
  lgpdCurrentTermsVersion: '2026-06-30',
  lgpdConsentedAt: '2026-07-31T19:23:43Z',
  lgpdAcceptedPolicyVersion: '2026-06-30',
  lgpdAcceptedTermsVersion: '2026-06-30',
}

const ASSESSORIA = {
  id: 'tenant-uuid',
  nome: 'Corridas Serra',
  temLogo: false,
  plano: 'BASIC',
  uso: { atletas: 0, maxAtletas: 10, tecnicos: 1, maxTecnicos: 1 },
  version: 1,
}

/**
 * Serve o `me` com o onboarding pendente até a conclusão ser chamada — depois disso, concluído.
 * É assim que o servidor real se comporta, e é o que permite provar a persistência.
 */
async function mockarBackend(page: Page, opcoes: { onboardingConcluido: boolean }) {
  let concluido = opcoes.onboardingConcluido

  // ORDEM IMPORTA: no Playwright a rota registrada por ÚLTIMO vence, e `**/api/v1/users/me**`
  // também casa com `.../me/onboarding/concluir`. Registrando o `me` primeiro, o POST de conclusão
  // era respondido com o JSON do `me` e a conclusão nunca acontecia — o wizard ficava montado para
  // sempre, com aparência de bug de produto.
  await page.route(ME_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...BASE_ME, onboardingConcluido: concluido }),
    }),
  )

  await page.route(CONCLUIR_API, async (route) => {
    concluido = true
    await route.fulfill({ status: 204, body: '' })
  })

  await page.route(ASSESSORIA_API, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASSESSORIA) }),
  )

  // A tela de atletas é o destino do wizard: sem a lista mockada, ela renderiza o estado de erro e
  // o teste provaria apenas que a rota existe, não que ela funciona.
  await page.route(ATLETAS_API, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.route('**/api/v1/coach/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
}

test.describe('Coach — wizard de boas-vindas', () => {
  test.beforeEach(async ({ page }) => {
    await autenticarComPkce(page, { roles: ['PROPRIETARIO', 'TECNICO'] })
  })

  test('coach novo vê o wizard antes do dashboard', async ({ page }) => {
    await mockarBackend(page, { onboardingConcluido: false })

    await page.goto(INBOX_URL)

    await expect(page.getByRole('heading', { name: /bem-vindo à menthoros/i })).toBeVisible()
    // O shell fica atrás do gate: nada de navegação enquanto o wizard está montado.
    await expect(page.getByRole('navigation')).toHaveCount(0)
  })

  /**
   * O wizard **não pede cadastro de atleta** — pedir dados de outra pessoa no primeiro minuto é
   * atrito, e o cadastro errado feito ali vira registro difícil de remover. Ele confirma o que é do
   * próprio coach e entrega o caminho.
   */
  test('duas etapas: confirma a assessoria e sai para a tela de atletas', async ({ page }) => {
    await mockarBackend(page, { onboardingConcluido: false })
    await page.goto(INBOX_URL)

    await expect(page.getByLabel(/nome da assessoria/i)).toHaveValue('Corridas Serra')
    await expect(page.getByLabel(/nome do atleta/i)).toHaveCount(0)
    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page.getByRole('heading', { name: /tudo pronto/i })).toBeVisible()
    await expect(page.getByLabel(/nome do atleta/i)).toHaveCount(0)

    await page.getByRole('button', { name: /cadastrar meu primeiro atleta/i }).click()

    // Só o E2E prova isto: a rota do botão existe de verdade e a tela de destino monta. O teste de
    // componente mocka `useNavigate` e só consegue afirmar o argumento.
    await expect(page).toHaveURL(/#\/coach\/athletes/)
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('heading', { name: /bem-vindo à menthoros/i })).toHaveCount(0)
  })

  test('"fazer depois" fecha o wizard e libera o dashboard', async ({ page }) => {
    await mockarBackend(page, { onboardingConcluido: false })
    await page.goto(INBOX_URL)

    await page.getByRole('button', { name: /continuar/i }).click()
    await page.getByRole('button', { name: /fazer depois/i }).click()

    // O wizard some e o shell aparece: é o `me` revalidado que libera, não estado local.
    await expect(page.getByRole('heading', { name: /bem-vindo à menthoros/i })).toHaveCount(0)
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page).toHaveURL(/#\/coach\/inbox/)
  })

  /**
   * O caso que prova que a conclusão persistiu. Se o wizard reaparecesse aqui, o coach ficaria
   * preso num loop de boas-vindas a cada carregamento — e o teste anterior, sozinho, não pegaria.
   */
  test('após concluir, recarregar não traz o wizard de volta', async ({ page }) => {
    await mockarBackend(page, { onboardingConcluido: false })
    await page.goto(INBOX_URL)

    await page.getByRole('button', { name: /pular por agora/i }).click()
    await expect(page.getByRole('navigation')).toBeVisible()

    await page.reload()

    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('heading', { name: /bem-vindo à menthoros/i })).toHaveCount(0)
  })

  test('coach legado entra direto, sem interrupção', async ({ page }) => {
    await mockarBackend(page, { onboardingConcluido: true })

    await page.goto(INBOX_URL)

    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('heading', { name: /bem-vindo à menthoros/i })).toHaveCount(0)
  })

  /**
   * O consentimento precede o wizard porque o wizard escreve dados. Se esta ordem inverter, o
   * coach grava informação no produto antes de aceitar os termos.
   */
  test('consentimento pendente aparece antes do wizard', async ({ page }) => {
    await page.route(CONCLUIR_API, (route) => route.fulfill({ status: 204, body: '' }))
    await page.route(ME_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...BASE_ME, lgpdConsentGranted: false, onboardingConcluido: false }),
      }),
    )
    await page.route('**/api/v1/coach/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto(INBOX_URL)

    await expect(page.getByRole('button', { name: /aceitar e continuar/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /bem-vindo à menthoros/i })).toHaveCount(0)
  })

  /**
   * Com o gate montado, as chamadas de dashboard não podem sair por trás — elas voltariam 403 com
   * o enforcement de consentimento ligado, e ninguém consumiria a resposta de qualquer forma.
   */
  test('com o wizard montado, o dashboard não é buscado', async ({ page }) => {
    const chamadasDeDashboard: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/coach/')) chamadasDeDashboard.push(req.url())
    })

    await mockarBackend(page, { onboardingConcluido: false })
    await page.goto(INBOX_URL)
    await expect(page.getByRole('heading', { name: /bem-vindo à menthoros/i })).toBeVisible()

    expect(chamadasDeDashboard).toHaveLength(0)
  })
})
