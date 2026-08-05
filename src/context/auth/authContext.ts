import { createContext } from 'react';

export interface AuthContextData {
  /**
   * `true` só quando há sessão confirmada.
   *
   * **Não decida sozinho que o usuário é anônimo por este campo** — veja `carregando`. Enquanto o
   * retorno do fluxo de autorização ou uma renovação estão em curso, a resposta correta é "ainda não
   * sei", e tratá-la como "não autenticado" manda o usuário ao login no meio do próprio login.
   */
  isAuthenticated: boolean;

  /**
   * `true` enquanto o estado de autenticação ainda não é conhecido: bootstrap, processamento do
   * callback ou renovação em curso.
   *
   * Existe porque `isAuthenticated: false` é ambíguo — cobre "anônimo" e "ainda não sei". Tratar os
   * dois como a mesma coisa foi a origem do spinner infinito em `add-coach-settings-page`, e aqui
   * produziria laço de redirecionamento durante o callback.
   */
  carregando: boolean;

  /**
   * Inicia o fluxo de autorização (redireciona ao Keycloak).
   *
   * `destino` é a rota para onde voltar depois do login; viaja no `state` do fluxo. Sem ele, quem
   * saiu de `#/coach/inbox` volta para a raiz e cai na landing.
   */
  login: (destino?: string) => Promise<void>;

  /** Encerra a sessão no Keycloak (RP-initiated), não apenas o estado local. */
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData | null>(null);
