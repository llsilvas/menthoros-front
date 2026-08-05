import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TOKEN_STORAGE_KEY,
  definirRenovacaoPendente,
  definirUsuario,
  getAccessToken,
  getAccessTokenSync,
  getClaims,
  getRoles,
  getTenantId,
  limparTokenLegado,
  limparUsuario,
} from './session';

/**
 * Monta um JWT sem assinatura válida — só o payload importa, porque a verificação de assinatura é
 * do backend.
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

/** Só o que `session` consome de um `User` do oidc-client-ts. */
function usuarioOidc(accessToken: string) {
  return { access_token: accessToken } as unknown as Parameters<typeof definirUsuario>[0];
}

/**
 * Storage próprio em vez do global do ambiente: o jsdom deste runtime não fornece `localStorage`
 * (`window.localStorage` é `undefined`) e o Node 26 expõe um nativo indisponível sem
 * `--localstorage-file`. Depender do global tornaria o teste refém da versão do Node.
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
    limparUsuario();
    definirRenovacaoPendente(null);
  });

  describe('token', () => {
    it('devolve o token do usuário autenticado', async () => {
      definirUsuario(usuarioOidc(tokenValido));

      expect(getAccessTokenSync()).toBe(tokenValido);
      await expect(getAccessToken()).resolves.toBe(tokenValido);
    });

    it('devolve string vazia sem sessão, em vez de lançar', async () => {
      await expect(getAccessToken()).resolves.toBe('');
      expect(getAccessTokenSync()).toBe('');
    });

    // A renovação por redirect não é instantânea. Uma chamada de API disparada no meio dela não
    // pode sair com o token velho nem com string vazia.
    it('aguarda a renovação pendente antes de devolver o token', async () => {
      const tokenNovo = fakeToken({ realm_access: { roles: ['TECNICO'] }, tenantId: 'tenant-abc' });
      definirUsuario(usuarioOidc(tokenValido));

      let concluir: () => void = () => {};
      const renovacao = new Promise<void>((r) => {
        concluir = r;
      }).then(() => {
        definirUsuario(usuarioOidc(tokenNovo));
      });
      definirRenovacaoPendente(renovacao);

      const promessa = getAccessToken();
      concluir();

      await expect(promessa).resolves.toBe(tokenNovo);
    });
  });

  describe('claims derivadas', () => {
    it('tenantId e roles saem do mesmo token', () => {
      definirUsuario(usuarioOidc(tokenValido));

      expect(getTenantId()).toBe('tenant-abc');
      expect(getRoles()).toEqual(['TECNICO']);
      expect(getClaims()?.sub).toBe('user-1');
    });

    // Regressão do risco do pré-mortem: token e X-Tenant-ID saindo de leituras diferentes fazem uma
    // renovação produzir Authorization novo com tenant ausente.
    it('token e tenantId vêm da mesma fonte', () => {
      definirUsuario(usuarioOidc(tokenValido));
      expect(getAccessTokenSync()).toBe(tokenValido);
      expect(getTenantId()).toBe('tenant-abc');

      limparUsuario();
      expect(getAccessTokenSync()).toBe('');
      expect(getTenantId()).toBeUndefined();
    });

    it('sem sessão, claims são vazias e não lançam', () => {
      expect(getClaims()).toBeNull();
      expect(getTenantId()).toBeUndefined();
      expect(getRoles()).toEqual([]);
    });

    it('token malformado não derruba a aplicação', () => {
      definirUsuario(usuarioOidc('nao-e-um-jwt'));

      expect(getClaims()).toBeNull();
      expect(getRoles()).toEqual([]);
    });
  });

  describe('nada é persistido', () => {
    // Critério de aceite da change: `localStorage` sem token depois de autenticar.
    it('autenticar não escreve no localStorage', () => {
      definirUsuario(usuarioOidc(tokenValido));

      expect(localStorage.length).toBe(0);
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });
  });

  describe('limparTokenLegado', () => {
    // Decisão 0.5: derrubar todas as sessões vigentes na virada, em vez de deixar expirar. Sem isso
    // sobra token velho no storage com o app já esperando sessão em memória.
    it('remove a chave do mecanismo antigo', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenValido);

      limparTokenLegado();

      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('é idempotente quando não há nada a limpar', () => {
      expect(() => limparTokenLegado()).not.toThrow();
    });
  });
});
