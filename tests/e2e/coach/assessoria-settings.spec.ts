import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Configuração da assessoria — o fluxo que cruza Keycloak (role `PROPRIETARIO`) e o contrato novo
 * de `/api/v1/assessorias/me`.
 *
 * O que esta suíte cobre e os testes de componente não conseguem: o roteamento real por hash, o
 * gate de consentimento do `CoachLayout` no caminho, o destaque da sidebar sob uma sub-rota, e a
 * sessão vinda do fluxo PKCE em vez de um token plantado à mão.
 */

const SETTINGS_URL = '/#/coach/settings'
const ASSESSORIA_URL = '/#/coach/settings/assessoria'

const ME_API = '**/api/v1/users/me**'
const ASSESSORIA_API = '**/api/v1/assessorias/me'
const LOGO_API = '**/api/v1/assessorias/me/logo**'

const COACH_ME = {
  id: 'coach-uuid',
  nome: 'Coach Dono',
  email: 'dono@teste.com',
  avatarUrl: null,
  assessoria: { id: 'tenant-uuid', nome: 'Corridas Serra' },
  // Consentimento em dia: sem isto o layout renderiza o modal bloqueante e a página nunca aparece.
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
  uso: { atletas: 7, maxAtletas: 10, tecnicos: 1, maxTecnicos: 1 },
  version: 3,
}

/** Rotas que o shell do coach precisa para chegar até a página, sem tela de consentimento. */
async function mockarShell(page: Page) {
  await page.route(ME_API, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(COACH_ME) }),
  )
  // O layout busca fila/revisões; devolver vazio evita que uma 404 vire ruído no console.
  await page.route('**/api/v1/coach/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
}

test.describe('Coach — configuração da assessoria', () => {
  test.beforeEach(async ({ page }) => {
    // Papéis reais do dono: `PROPRIETARIO` é composite de `TECNICO` no realm, então o token
    // legítimo traz as duas — reproduzir só uma delas testaria um cenário que não existe.
    await autenticarComPkce(page, { roles: ['PROPRIETARIO', 'TECNICO'] })
    await mockarShell(page)
  })

  test('chega à página pelo card de Configurações e mantém a sidebar destacada', async ({ page }) => {
    await page.route(ASSESSORIA_API, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASSESSORIA) }),
    )

    await page.goto(SETTINGS_URL)
    await page.getByRole('link', { name: /configurar assessoria/i }).click()

    await expect(page).toHaveURL(/#\/coach\/settings\/assessoria/)
    await expect(page.getByRole('heading', { name: 'Assessoria' })).toBeVisible()

    // O item da sidebar continua ACESO sob a sub-rota — `aria-current="page"`, que é como o
    // componente marca o ativo. Verificar só a visibilidade do texto não provaria nada: o item
    // existe na sidebar em qualquer rota, e o teste passaria igual com o bug.
    //
    // Antes da correção em `CoachLayout`, o match exato de pathname fazia `aria-current` sumir de
    // TODOS os itens aqui — a navegação inteira ficava sem destaque.
    await expect(page.locator('[aria-current="page"]')).toHaveText(/Configurações/)
  })

  test('exibe identidade, plano e uso vindos da API', async ({ page }) => {
    await page.route(ASSESSORIA_API, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASSESSORIA) }),
    )

    await page.goto(ASSESSORIA_URL)

    await expect(page.getByLabel(/nome da assessoria/i)).toHaveValue('Corridas Serra')
    await expect(page.getByText('BASIC')).toBeVisible()
    await expect(page.getByText('7 de 10')).toBeVisible()
  })

  test('salva o nome enviando a versão lida no GET', async ({ page }) => {
    let corpoDoPatch: unknown = null

    await page.route(ASSESSORIA_API, async (route) => {
      if (route.request().method() === 'PATCH') {
        corpoDoPatch = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...ASSESSORIA, nome: 'Corridas Serra Pro', version: 4 }),
        })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASSESSORIA) })
    })

    await page.goto(ASSESSORIA_URL)
    await page.getByLabel(/nome da assessoria/i).fill('Corridas Serra Pro')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText(/nome atualizado/i)).toBeVisible()
    expect(corpoDoPatch).toEqual({ nome: 'Corridas Serra Pro', version: 3 })
  })

  test('conflito de edição oferece recarregar sem descartar o rascunho', async ({ page }) => {
    await page.route(ASSESSORIA_API, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ status: 409, message: 'versão obsoleta' }),
        })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASSESSORIA) })
    })

    await page.goto(ASSESSORIA_URL)
    await page.getByLabel(/nome da assessoria/i).fill('Nome Concorrente')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByRole('button', { name: /recarregar/i })).toBeVisible()
    // O que o coach digitou continua ali: perder a corrida não deve custar o texto.
    await expect(page.getByLabel(/nome da assessoria/i)).toHaveValue('Nome Concorrente')
  })

  test('envia a logo e passa a exibi-la', async ({ page }) => {
    let recebeuUpload = false

    await page.route(LOGO_API, async (route) => {
      if (route.request().method() === 'POST') {
        recebeuUpload = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...ASSESSORIA,
            temLogo: true,
            logoUrl: '/api/v1/assessorias/me/logo',
            version: 4,
          }),
        })
        return
      }
      // GET da imagem: 1x1 PNG transparente, o suficiente para o <img> resolver.
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64',
        ),
      })
    })
    await page.route(ASSESSORIA_API, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASSESSORIA) }),
    )

    await page.goto(ASSESSORIA_URL)
    await page.getByLabel(/selecionar imagem da logo/i).setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      ),
    })

    await expect(page.getByText(/logo atualizada/i)).toBeVisible()
    expect(recebeuUpload).toBe(true)
    await expect(page.getByRole('button', { name: /trocar logo/i })).toBeVisible()
  })

  test('arquivo grande demais é barrado sem chegar ao servidor', async ({ page }) => {
    let tentouEnviar = false

    await page.route(LOGO_API, async (route) => {
      tentouEnviar = true
      await route.fulfill({ status: 422, contentType: 'application/json', body: '{}' })
    })
    await page.route(ASSESSORIA_API, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASSESSORIA) }),
    )

    await page.goto(ASSESSORIA_URL)
    await page.getByLabel(/selecionar imagem da logo/i).setInputFiles({
      name: 'gigante.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(3 * 1024 * 1024, 1),
    })

    await expect(page.getByText(/no máximo 2 MB/i)).toBeVisible()
    expect(tentouEnviar).toBe(false)
  })
})

test.describe('Coach — técnico contratado', () => {
  test.beforeEach(async ({ page }) => {
    // Sem `PROPRIETARIO`: é o técnico que trabalha na assessoria, não o dono dela.
    await autenticarComPkce(page, { roles: ['TECNICO'] })
    await mockarShell(page)
  })

  /**
   * A autorização de verdade é do backend (`403`), e o teste reproduz essa resposta em vez de
   * assumir que o front esconde o botão — esconder é conveniência, não controle de acesso.
   */
  test('vê a configuração mas recebe erro ao tentar salvar', async ({ page }) => {
    await page.route(ASSESSORIA_API, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASSESSORIA) })
    })

    await page.goto(ASSESSORIA_URL)
    await expect(page.getByLabel(/nome da assessoria/i)).toHaveValue('Corridas Serra')

    await page.getByLabel(/nome da assessoria/i).fill('Tentativa do técnico')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText(/não foi possível salvar/i)).toBeVisible()
  })
})
