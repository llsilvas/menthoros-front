import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'oidc-client-ts';
import { AuthContext } from './authContext';
import {
  definirRenovacaoPendente,
  definirUsuario,
  limparTokenLegado,
  limparUsuario,
} from './session';
import {
  CHAVE_DESTINO,
  ehRetornoDeAutorizacao,
  limparParametrosDeAutorizacao,
  userManager,
} from './userManager';

/**
 * Ponte entre o `UserManager` (OIDC) e o resto da aplicação.
 *
 * **Este é o único arquivo que sabe que existe OIDC.** O `AuthContext`/`useAuth` continua sendo a
 * interface pública — decisão D1 da change `migrate-login-to-authorization-code-pkce`: adotar o
 * provider da biblioteca traria um segundo `useAuth` ao projeto, e importar o errado é um engano
 * que compila.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Começa carregando: no primeiro render ainda não se sabe se há sessão. Assumir "anônimo" aqui
  // faria o guard de rota redirecionar antes de o callback ser processado.
  const [carregando, setCarregando] = useState(true);

  const aplicarUsuario = useCallback((user: User | null) => {
    if (user && !user.expired) {
      definirUsuario(user);
      setIsAuthenticated(true);
      return;
    }
    limparUsuario();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      try {
        // Sessão do mecanismo antigo não sobrevive à virada (decisão 0.5 da change).
        limparTokenLegado();

        if (ehRetornoDeAutorizacao()) {
          const user = await userManager.signinCallback();
          limparParametrosDeAutorizacao();

          const destino = (user?.state as Record<string, unknown> | undefined)?.[CHAVE_DESTINO];
          if (typeof destino === 'string' && destino) {
            // O destino volta como rota de hash: a raiz é só o endereço de retorno do OIDC, não o
            // lugar onde o usuário estava.
            window.location.hash = destino.startsWith('#') ? destino : `#${destino}`;
          }

          if (ativo) aplicarUsuario(user ?? null);
          return;
        }

        const user = await userManager.getUser();
        if (ativo) aplicarUsuario(user);
      } catch {
        // Falha ao restaurar sessão é "não autenticado", não erro fatal: o usuário segue para o
        // login. Propagar aqui deixaria a aplicação sem render nenhum.
        if (ativo) aplicarUsuario(null);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void inicializar();

    return () => {
      ativo = false;
    };
  }, [aplicarUsuario]);

  useEffect(() => {
    const aoCarregarUsuario = (user: User) => aplicarUsuario(user);
    const aoDescarregarUsuario = () => aplicarUsuario(null);

    /**
     * Renovação por **redirect**, não por iframe: todos os ambientes são cross-site, e o cookie de
     * sessão do Keycloak seria third-party dentro do iframe — bloqueado por padrão em Safari e
     * Firefox, falhando em silêncio (decisão 0.2 / D6).
     *
     * Dispara com folga sobre o expiry (`accessTokenExpiringNotificationTimeInSeconds`), para
     * renovar antes de uma chamada tomar 401 no meio de uma ação do treinador.
     */
    const aoExpirar = () => {
      const destino = window.location.hash || undefined;
      const renovacao = userManager
        .signinRedirect({ state: { [CHAVE_DESTINO]: destino } })
        .catch(() => {
          // Renovação falhou: cai para não autenticado e o guard leva ao login — uma vez, sem laço,
          // porque `carregando` já é false e o estado é definitivo.
          aplicarUsuario(null);
        });
      definirRenovacaoPendente(renovacao);
    };

    userManager.events.addUserLoaded(aoCarregarUsuario);
    userManager.events.addUserUnloaded(aoDescarregarUsuario);
    userManager.events.addAccessTokenExpiring(aoExpirar);

    return () => {
      userManager.events.removeUserLoaded(aoCarregarUsuario);
      userManager.events.removeUserUnloaded(aoDescarregarUsuario);
      userManager.events.removeAccessTokenExpiring(aoExpirar);
    };
  }, [aplicarUsuario]);

  const login = useCallback(async (destino?: string) => {
    await userManager.signinRedirect({
      state: { [CHAVE_DESTINO]: destino ?? window.location.hash },
    });
  }, []);

  /**
   * Encerra a sessão **no Keycloak**, não só localmente.
   *
   * Antes, o logout apenas apagava a chave do storage: a sessão no provedor continuava viva e um
   * novo login não pedia credenciais. O usuário achava que tinha saído e não tinha.
   */
  const logout = useCallback(async () => {
    limparUsuario();
    setIsAuthenticated(false);
    await userManager.signoutRedirect();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
