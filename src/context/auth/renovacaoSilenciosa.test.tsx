import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import type { User } from 'oidc-client-ts';
import { AuthProvider } from './AuthProvider';
import { userManager } from './userManager';
import { getAccessToken } from './session';

/**
 * Renovação **silenciosa** do token — o app observa, não chama.
 *
 * Antes desta change a renovação era um `signinRedirect`: a página inteira descarregava a cada ~4
 * minutos (`accessTokenLifespan` 300s menos a folga de 60s). Não era glitch de render — era
 * navegação, com perda de estado de componente e de scroll no meio do trabalho do treinador.
 *
 * Com `automaticSilentRenew`, quem chama `signinSilent()` é o `SilentRenewService` da biblioteca.
 * **O app não pode chamar também**: seriam duas renovações concorrentes e, com
 * `revokeRefreshToken` ligado no realm, a segunda reapresenta um refresh token já rotacionado pela
 * primeira — o Keycloak trata como replay e derruba a sessão. O mecanismo de proteção viraria a
 * causa da queda.
 *
 * Daí o contrato testado aqui: três eventos, nenhuma chamada.
 */

const usuarioFalso = (token: string) =>
  ({ access_token: token, expired: false, profile: {} }) as unknown as User;

/**
 * Captura os handlers que o `AuthProvider` registra, em vez de cutucar os internals da biblioteca:
 * o que interessa testar é o contrato do app com os eventos, não a implementação do `UserManager`.
 */
const handlers: {
  expirando?: () => void;
  carregado?: (u: User) => void;
  erroDeRenovacao?: (e: unknown) => void;
} = {};

describe('renovação silenciosa', () => {
  beforeEach(() => {
    handlers.expirando = undefined;
    handlers.carregado = undefined;
    handlers.erroDeRenovacao = undefined;

    vi.spyOn(userManager, 'getUser').mockResolvedValue(usuarioFalso('token-inicial'));
    vi.spyOn(userManager, 'signinRedirect').mockResolvedValue(undefined);
    vi.spyOn(userManager, 'signinSilent').mockResolvedValue(usuarioFalso('token-novo'));

    vi.spyOn(userManager.events, 'addAccessTokenExpiring').mockImplementation((cb) => {
      handlers.expirando = cb as () => void;
      return () => {};
    });
    vi.spyOn(userManager.events, 'addUserLoaded').mockImplementation((cb) => {
      handlers.carregado = cb as (u: User) => void;
      return () => {};
    });
    vi.spyOn(userManager.events, 'addSilentRenewError').mockImplementation((cb) => {
      handlers.erroDeRenovacao = cb as (e: unknown) => void;
      return () => {};
    });
    vi.spyOn(userManager.events, 'removeAccessTokenExpiring').mockImplementation(() => {});
    vi.spyOn(userManager.events, 'removeUserLoaded').mockImplementation(() => {});
    vi.spyOn(userManager.events, 'removeSilentRenewError').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * O defeito que esta change corrige. Antes, `accessTokenExpiring` disparava `signinRedirect` —
   * a piscada.
   */
  it('não navega quando o token está para expirar', async () => {
    render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(userManager.getUser).toHaveBeenCalled());

    act(() => handlers.expirando?.());

    expect(userManager.signinRedirect).not.toHaveBeenCalled();
  });

  /**
   * A lib renova sozinha. Se o app também chamasse, seriam duas renovações concorrentes — e com
   * rotação de refresh token no realm, a segunda vira replay e derruba a sessão.
   */
  it('não chama a renovação — quem renova é a biblioteca', async () => {
    render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(userManager.getUser).toHaveBeenCalled());

    act(() => handlers.expirando?.());

    expect(userManager.signinSilent).not.toHaveBeenCalled();
  });

  /**
   * `session.ts` segura requisições enquanto há renovação pendente: uma chamada disparada no meio
   * sairia com o token velho e tomaria 401. Esse contrato precisa sobreviver à mudança, e agora
   * depende de um deferred — não há mais promessa de `signinRedirect` para registrar.
   */
  it('segura requisições durante a renovação e devolve o token novo', async () => {
    render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(userManager.getUser).toHaveBeenCalled());

    act(() => handlers.expirando?.());

    let resolvido: string | null = null;
    const pendente = getAccessToken().then((t) => (resolvido = t));

    await Promise.resolve();
    expect(resolvido).toBeNull();

    act(() => handlers.carregado?.(usuarioFalso('token-novo')));
    await pendente;

    expect(resolvido).toBe('token-novo');
  });

  /**
   * O erro da renovação automática é publicado por `_raiseSilentRenewError` e **não** passa pelo
   * `catch` do `signinRedirect` manual — era a peça que faltava no desenho original. Sem assinar
   * este evento, a falha aconteceria e nada reagiria.
   */
  it('libera as requisições quando a renovação falha, sem travar', async () => {
    render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(userManager.getUser).toHaveBeenCalled());

    act(() => {
      handlers.expirando?.();
      handlers.erroDeRenovacao?.(new Error('refresh expirado'));
    });

    await expect(getAccessToken()).resolves.toBeDefined();
  });
});
