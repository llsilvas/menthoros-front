import { vi } from 'vitest';

/**
 * `window.matchMedia` para testes de componente.
 *
 * O jsdom não implementa `matchMedia`, e o `useMediaQuery` do MUI devolve `false` para qualquer
 * query quando ele não existe — ou seja, todo teste roda como se a tela não casasse com nenhum
 * breakpoint, e um comportamento responsivo nunca é exercitado. Isto instala uma implementação que
 * resolve `(min-width: Npx)` e `(max-width: Npx)` contra uma largura simulada.
 *
 * Só `min-width`/`max-width` em px são avaliados (é o que o MUI gera a partir de
 * `theme.breakpoints`); qualquer outra feature retorna `false`, como antes.
 */
export function simularLarguraDaTela(larguraPx: number) {
  const avaliar = (query: string): boolean => {
    const condicoes = [...query.matchAll(/\((min|max)-width:\s*([\d.]+)px\)/g)];
    if (condicoes.length === 0) return false;
    return condicoes.every(([, tipo, valor]) =>
      tipo === 'min' ? larguraPx >= Number(valor) : larguraPx <= Number(valor),
    );
  };

  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
    matches: avaliar(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  }));
}
