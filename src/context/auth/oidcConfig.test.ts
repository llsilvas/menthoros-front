import { describe, it, expect } from 'vitest';
import { oidcSettings, authority } from './oidcConfig';

/**
 * Testa as **decisões**, não a biblioteca. Cada asserção aqui corresponde a um risco verificado no
 * ambiente real durante a discovery da change — sem elas, a config volta ao default da lib numa
 * refatoração distraída e o modo de falha só aparece em produção.
 */
describe('oidcConfig', () => {
  it('usa Authorization Code (não implícito, não password)', () => {
    expect(oidcSettings.response_type).toBe('code');
  });

  // O scope `organization` é OPTIONAL no client menthoros-web. Sem ele o token sai sem tenant_id,
  // o JwtTenantFilter rejeita tudo e o app responde 403 — com o login concluindo normalmente.
  it('pede o scope organization explicitamente', () => {
    expect(oidcSettings.scope).toContain('organization');
    expect(oidcSettings.scope).toContain('openid');
  });

  it('aponta o authority para o realm, não para a raiz do Keycloak', () => {
    expect(authority).toMatch(/\/realms\/[^/]+$/);
    expect(oidcSettings.authority).toBe(authority);
  });

  /**
   * Renova em silêncio, **por refresh token** — não por iframe.
   *
   * A versão anterior deste teste afirmava `automaticSilentRenew === false`, com o comentário de que
   * o cookie do Keycloak seria third-party dentro do iframe e o renew falharia calado. A premissa
   * sobre o iframe continua verdadeira; o que estava errado era a conclusão de que nenhuma renovação
   * silenciosa serviria. `signinSilent()` usa o refresh token quando ele existe, e um POST com token
   * no corpo não depende de cookie nenhum.
   */
  it('renova em silêncio, sem recarregar a página', () => {
    expect(oidcSettings.automaticSilentRenew).toBe(true);
  });

  /**
   * Sem refresh token em memória — toda aba nova, todo reload — a lib cairia no iframe. Sem esta
   * URL ela falha explicitamente, e a falha vira `silentRenewError`, tratado no `AuthProvider`.
   * Um iframe cross-site morreria em silêncio; falhar alto é o comportamento desejado.
   */
  it('não configura silent_redirect_uri, para o iframe falhar alto', () => {
    expect(oidcSettings.silent_redirect_uri).toBeUndefined();
  });

  it('renova com folga, em vez de reagir ao token já expirado', () => {
    expect(oidcSettings.accessTokenExpiringNotificationTimeInSeconds).toBeGreaterThan(0);
  });

  // O critério de aceite é "localStorage não contém token". Um store persistente aqui violaria isso
  // silenciosamente, porque o login continuaria funcionando.
  it('guarda o usuário em memória, não em storage persistente', () => {
    const store = oidcSettings.userStore;
    expect(store).toBeDefined();
    expect(JSON.stringify(store)).not.toContain('localStorage');
  });

  it('retorna para a raiz da aplicação, evitando rota de callback sob hash router', () => {
    expect(oidcSettings.redirect_uri).toBe(`${window.location.origin}/`);
    expect(oidcSettings.redirect_uri).not.toContain('#');
  });

  /**
   * `stateStore` é diferente do `userStore` e **precisa** persistir: guarda o `code_verifier` do
   * PKCE durante o redirect, e o redirect recarrega a página. Em memória, a troca do `code` por
   * token falharia em 100% dos logins — modo de falha total que só apareceria no primeiro login
   * real, porque nenhum teste de config o revela.
   */
  it('mantém um stateStore persistente, separado do userStore em memória', () => {
    expect(oidcSettings.stateStore).toBeDefined();
    expect(oidcSettings.stateStore).not.toBe(oidcSettings.userStore);
  });
});
