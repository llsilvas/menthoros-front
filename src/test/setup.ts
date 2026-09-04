// Setup global do Vitest (jsdom).
// Adiciona os matchers do jest-dom (toBeInTheDocument, toHaveTextContent, etc.)
// e limpa o DOM entre os testes.
import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom não implementa scrollIntoView; componentes que fazem auto-scroll o chamam em efeitos de
// montagem. Stub global evita ruído nos testes de componente.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

/**
 * Storage em memória para `localStorage` e `sessionStorage`.
 *
 * **Por que isto existe:** o jsdom deste runtime não fornece Web Storage (`window.localStorage` é
 * `undefined`), e o Node 26 expõe um `localStorage` nativo experimental que fica indisponível sem
 * `--localstorage-file`. O resultado é que *qual* teste quebra passa a depender da versão do Node —
 * um CI com runtime diferente do dev discordaria da máquina local, e um CI que discorda é um CI que
 * as pessoas aprendem a ignorar.
 *
 * Fornecer aqui elimina a dependência da versão e evita que cada teste repita o próprio stub. Foi o
 * que destravou os testes do fluxo OIDC: o `stateStore` do `oidc-client-ts` guarda o `code_verifier`
 * do PKCE em Web Storage, então sem isso nem a URL de autorização era gerada.
 */
function criarStorage(): Storage {
  const dados = new Map<string, string>();
  return {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => void dados.set(chave, String(valor)),
    removeItem: (chave: string) => void dados.delete(chave),
    clear: () => dados.clear(),
    key: (indice: number) => [...dados.keys()][indice] ?? null,
    get length() {
      return dados.size;
    },
  } as Storage;
}

// Instância nova por teste: storage compartilhado vaza estado de um teste para outro, e o sintoma
// aparece longe da causa.
beforeEach(() => {
  vi.stubGlobal('localStorage', criarStorage());
  vi.stubGlobal('sessionStorage', criarStorage());
});

afterEach(() => {
  cleanup();
});

/**
 * jsdom não implementa `getContext` — e, em vez de lançar, ele imprime um stack
 * trace de "Not implemented" na console virtual a cada render que mede texto.
 *
 * O código de produção já trata a ausência de canvas (`measureText.ts` cai numa
 * estimativa por caractere), então o comportamento está correto; o problema é o
 * ruído. Um stderr cheio de stack traces esperados é onde um erro de verdade
 * passa despercebido — que é o mesmo motivo de o CI não poder nascer vermelho.
 */
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
}
