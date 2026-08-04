import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TOKEN_STORAGE_KEY,
  clearToken,
  getAccessToken,
  getAccessTokenSync,
  getClaims,
  getRoles,
  getTenantId,
  setToken,
} from './session';

/**
 * Monta um JWT sem assinatura válida — só o payload importa, porque a verificação de assinatura é
 * do backend. Mesmo formato usado em `LoginPage.test.tsx`.
 */
function fakeToken(payload: Record<string, unknown>): string {
  const base64url = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${base64url}.signature`;
}

const tokenValido = fakeToken({
  realm_access: { roles: ['TECNICO'] },
  exp: Math.floor(Date.now() / 1000) + 3600,
  tenantId: 'tenant-abc',
  sub: 'user-1',
});

/**
 * Storage próprio em vez do global do ambiente.
 *
 * Neste runtime o jsdom não fornece `localStorage` (`window.localStorage` é `undefined`) e o Node 26
 * expõe um nativo experimental que fica indisponível sem `--localstorage-file`. Depender do global
 * tornaria o teste refém da versão do Node. Um stub explícito também deixa o contrato visível: o
 * módulo precisa apenas de `getItem`/`setItem`/`removeItem`.
 */
function criarStorage(): Storage {
  const dados = new Map<string, string>();
  return {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, String(v)),
    removeItem: (k: string) => void dados.delete(k),
    clear: () => dados.clear(),
    key: (i: number) => [...dados.keys()][i] ?? null,
    get length() {
      return dados.size;
    },
  } as Storage;
}

describe('session — fonte única de token e claims', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', criarStorage());
  });

  describe('getAccessToken', () => {
    it('devolve o token guardado', async () => {
      setToken(tokenValido);

      await expect(getAccessToken()).resolves.toBe(tokenValido);
    });

    it('devolve string vazia quando não há token, em vez de lançar', async () => {
      await expect(getAccessToken()).resolves.toBe('');
    });

    // `OpenAPI.TOKEN` é assíncrono, mas o roteamento pós-login lê no corpo do render. As duas
    // formas precisam existir e concordar.
    it('a forma síncrona concorda com a assíncrona', async () => {
      setToken(tokenValido);

      expect(getAccessTokenSync()).toBe(await getAccessToken());
    });
  });

  describe('claims derivadas', () => {
    it('tenantId e roles saem do mesmo token', () => {
      setToken(tokenValido);

      expect(getTenantId()).toBe('tenant-abc');
      expect(getRoles()).toEqual(['TECNICO']);
      expect(getClaims()?.sub).toBe('user-1');
    });

    // Regressão do risco levantado no pré-mortem: se o header X-Tenant-ID e o Authorization saírem
    // de leituras diferentes, uma renovação produz Authorization novo com tenant ausente.
    it('token e tenantId vêm da mesma leitura', () => {
      setToken(tokenValido);

      expect(getAccessTokenSync()).toBe(tokenValido);
      expect(getTenantId()).toBe('tenant-abc');

      clearToken();

      expect(getAccessTokenSync()).toBe('');
      expect(getTenantId()).toBeUndefined();
    });

    it('sem token, claims são vazias e não lançam', () => {
      expect(getClaims()).toBeNull();
      expect(getTenantId()).toBeUndefined();
      expect(getRoles()).toEqual([]);
    });

    it('token malformado não derruba a aplicação', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, 'nao-e-um-jwt');

      expect(getClaims()).toBeNull();
      expect(getTenantId()).toBeUndefined();
      expect(getRoles()).toEqual([]);
    });
  });

  describe('setToken / clearToken', () => {
    it('grava e remove sob a chave conhecida', () => {
      setToken(tokenValido);
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(tokenValido);

      clearToken();
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });
  });
});
