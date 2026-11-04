import type { Page } from '@playwright/test'

/**
 * Regras de tipografia do app logado (padronizar-tipografia-inter), compartilhadas pelos smokes de
 * tema do coach e do atleta.
 */

/** Textos visíveis cuja primeira família computada não é Inter nem JetBrains Mono (exceção mono). */
export async function foraDaFamilia(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const achados: string[] = []
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const texto = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim() ?? '')
        .join('')
      if (!texto) continue
      const estilo = getComputedStyle(el)
      if (estilo.display === 'none' || estilo.visibility === 'hidden') continue
      const primeira = estilo.fontFamily.split(',')[0].trim().replace(/["']/g, '')
      if (primeira !== 'Inter' && primeira !== 'JetBrains Mono') achados.push(`${primeira}: ${texto.slice(0, 40)}`)
    }
    return achados
  })
}

/**
 * Pesos da Inter efetivamente baixados. Olha as `FontFace` com status `loaded`, não
 * `document.fonts.load`: este casa o peso mais próximo e devolveria a face 700 para um pedido de 800.
 * A Inter pode vir como face estática ("800") ou variável ("300 800").
 */
export async function pesosInterCarregados(page: Page, pesos: number[]): Promise<number[]> {
  return page.evaluate(async (alvo) => {
    await Promise.all(alvo.map((p) => document.fonts.load(`${p} 16px Inter`)))
    await document.fonts.ready
    const faces = Array.from(document.fonts).filter((f) => f.family.replace(/["']/g, '') === 'Inter' && f.status === 'loaded')
    return alvo.filter((p) =>
      faces.some((f) => {
        const [min, max = min] = f.weight.split(' ').map(Number)
        return p >= min && p <= max
      }),
    )
  }, pesos)
}
