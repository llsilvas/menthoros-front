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
  ehRecusaDeLoginSilencioso,
  ehRetornoDeAutorizacao,
  jaTentouRestaurar,
  limparParametrosDeAutorizacao,
  limparTentativaDeRestauracao,
  marcarTentativaDeRestauracao,
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

        /**
         * O Keycloak recusou a restauração silenciosa: não há sessão no provedor. É resposta
         * esperada, não erro — mas o usuário precisa **chegar a algum lugar**.
         *
         * O retorno cai na raiz (é o `redirect_uri`), e a raiz é a landing pública. Sem mandar para
         * o login explicitamente, quem tentou abrir uma rota protegida termina na página de
         * marketing, sem entender o que houve — bug encontrado pelo E2E de autenticação.
         */
        if (ehRecusaDeLoginSilencioso()) {
          limparParametrosDeAutorizacao();
          if (ativo) {
            aplicarUsuario(null);
            window.location.hash = '#/auth/login';
          }
          return;
        }

        if (ehRetornoDeAutorizacao()) {
          const user = await userManager.signinCallback();
          limparParametrosDeAutorizacao();
          limparTentativaDeRestauracao();

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
        if (user && !user.expired) {
          if (ativo) aplicarUsuario(user);
          return;
        }

        /**
         * Sem usuário em memória — é o caso de **recarregar a página**, porque o token não é
         * persistido (D2). Antes de concluir "anônimo", pergunta ao Keycloak se ainda há sessão.
         *
         * `prompt=none` **por redirect**, não por iframe: o iframe foi descartado porque o cookie de
         * sessão seria third-party em ambiente cross-site (D6) — mas numa navegação de topo ele é
         * first-party e vai normalmente. Se houver sessão, o Keycloak devolve o code na hora, sem
         * interação; se não houver, devolve `login_required`, tratado acima.
         *
         * A guarda existe porque isto é um redirect: falhar e tentar de novo produziria laço
         * infinito, com a tela piscando sem parar.
         */
        if (!jaTentouRestaurar()) {
          marcarTentativaDeRestauracao();
          await userManager.signinRedirect({
            prompt: 'none',
            state: { [CHAVE_DESTINO]: window.location.hash },
          });
          return; // a página navega; nada depois disto executa
        }

        if (ativo) aplicarUsuario(null);
      } catch (erro) {
        // Falha ao restaurar sessão é "não autenticado", não erro fatal: o usuário segue para o
        // login. Propagar aqui deixaria a aplicação sem render nenhum.
        //
        // Mas **não é silencioso**: engolir o motivo transforma qualquer defeito de autenticação em
        // "voltou para o login sem explicação", que é indistinguível de sessão expirada. O log é o
        // único rastro que sobra quando o fluxo falha no navegador de alguém.
        console.error('[auth] falha ao restaurar sessão:', erro);
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
