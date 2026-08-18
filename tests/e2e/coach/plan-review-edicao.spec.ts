import { test, expect, type Page } from '@playwright/test'
import { autenticarComPkce } from '../../fixtures/pkceAuth'

/**
 * Edição de treino na revisão do plano — primeira cobertura E2E desta tela.
 *
 * **Por que este arquivo existe.** O `CLAUDE.md` do front lista "editar um treino planejado" como
 * fluxo crítico: o que sai daqui é gravado no plano do atleta. A change
 * `preservar-serie-estruturada-na-edicao` mexe justamente no round-trip — hidratar as etapas,
 * editar, serializar de volta — e nenhum teste de unidade prova que o PATCH que sai pela rede
 * carrega a série intacta. Os testes de componente mockam o `onSave`; aqui o payload real é
 * interceptado.
 *
 * O que só aqui se prova: o corpo do PATCH que chega na API depois de o treinador abrir um fartlek
 * expandido e mexer em um campo.
 */

const REVIEW_URL = '/#/coach/planos/revisao'
const ME_API = '**/api/v1/users/me**'
const REVIEW_API = '**/api/v1/coach/planos/revisao*'
const PATCH_API = '**/api/v1/coach/planos/*/treinos/*'

const PLANO_ID = '11111111-1111-1111-1111-111111111111'
const TREINO_ID = '22222222-2222-2222-2222-222222222222'

const etapa = (ordem: number, tipoEtapa: string, duracaoMin: number, fcAlvoEtapa: string) =>
  ({ ordem, tipoEtapa, duracaoMin, fcAlvoEtapa })

/** Fartlek como o backend entrega: 4 pares já expandidos, sem blocoId. */
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
      tipoTreino: 'FARTLEK',
      distanciaKm: 8,
      duracaoMin: 'PT30M',
      zonaAlvo: 'Z4',
      percepcaoEsforcoEsperada: 7,
      tssPlanejado: 55,
      editadoPeloCoach: false,
      etapas: [
        etapa(1, 'AQUECIMENTO', 5, 'Z2'),
        etapa(2, 'INTERVALADO', 3, 'Z4'),
        etapa(3, 'RECUPERACAO', 2, 'Z1'),
        etapa(4, 'INTERVALADO', 3, 'Z4'),
        etapa(5, 'RECUPERACAO', 2, 'Z1'),
        etapa(6, 'INTERVALADO', 3, 'Z4'),
        etapa(7, 'RECUPERACAO', 2, 'Z1'),
        etapa(8, 'INTERVALADO', 3, 'Z4'),
        etapa(9, 'RECUPERACAO', 2, 'Z1'),
        etapa(10, 'DESAQUECIMENTO', 5, 'Z1'),
      ],
    },
  ],
}

async function mockarApis(page: Page) {
  // O CoachLayout só busca os planos depois do gate de consentimento e onboarding
  // (`liberado`), então o /me precisa vir completo — senão a tela carrega vazia.
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
  // A tela busca os três status; só AGUARDANDO_REVISAO tem plano.
  await page.route(REVIEW_API, route => {
    const status = new URL(route.request().url()).searchParams.get('status')
    route.fulfill({ json: status === 'AGUARDANDO_REVISAO' ? [PLANO] : [] })
  })
  // Rotas do dashboard que o layout carrega junto — vazias bastam.
  await page.route('**/api/v1/coach/dashboard*', route => route.fulfill({ json: {} }))
}

test.describe('revisão do plano — edição de treino', () => {
  test('PATCH preserva a série como bloco em vez de achatar', async ({ page }) => {
    await mockarApis(page)

    const patches: unknown[] = []
    await page.route(PATCH_API, async route => {
      patches.push(route.request().postDataJSON())
      await route.fulfill({ json: { ...PLANO.treinosPlanejados[0], editadoPeloCoach: true } })
    })

    await autenticarComPkce(page, { roles: ['TECNICO'] })
    await page.goto(REVIEW_URL)

    // seleciona o plano na fila e abre o treino para edição
    await page.getByRole('button', { name: /Atleta Teste/i }).click()
    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    // a série foi hidratada como bloco 4×, não como quatro pares soltos
    await expect(page.getByTestId('repeticoes-display-1')).toHaveText('4×')

    // muda as repetições e salva
    await page.getByLabel(/Aumentar repetições da série 2/i).click()
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect.poll(() => patches.length).toBe(1)
    const patch = patches[0] as { etapas?: Array<{ tipoEtapa: string; blocoRepeticoes?: number; subEtapas?: unknown[] }> }

    const bloco = patch.etapas?.find(e => e.tipoEtapa === 'BLOCO')
    expect(bloco, 'a série deve sair como BLOCO, não como etapas planas').toBeDefined()
    expect(bloco?.blocoRepeticoes).toBe(5)
    expect(bloco?.subEtapas).toHaveLength(2)
  })

  test('editar só o TSS não envia etapas — não regrava a estrutura', async ({ page }) => {
    await mockarApis(page)

    const patches: Record<string, unknown>[] = []
    await page.route(PATCH_API, async route => {
      patches.push(route.request().postDataJSON())
      await route.fulfill({ json: { ...PLANO.treinosPlanejados[0], editadoPeloCoach: true } })
    })

    await autenticarComPkce(page, { roles: ['TECNICO'] })
    await page.goto(REVIEW_URL)

    await page.getByRole('button', { name: /Atleta Teste/i }).click()
    await page.getByRole('button', { name: 'Editar treino' }).first().click()
    await expect(page.getByTestId('repeticoes-display-1')).toHaveText('4×')

    await page.getByLabel(/TSS planejado/i).fill('60')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect.poll(() => patches.length).toBe(1)
    expect(patches[0].tssPlanejado).toBe(60)
    expect(patches[0].etapas, 'edição administrativa não pode regravar as etapas').toBeUndefined()
  })
})
