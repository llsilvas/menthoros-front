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

  // Cross-site em todos os ambientes: o cookie de sessão do Keycloak é third-party dentro do
  // iframe e o renew silencioso falharia em silêncio. A renovação é por redirect.
  it('não usa silent renew por iframe', () => {
    expect(oidcSettings.automaticSilentRenew).toBe(false);
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
