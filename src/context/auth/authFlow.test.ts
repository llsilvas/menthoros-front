import { describe, it, expect } from 'vitest';
import { OidcClient } from 'oidc-client-ts';
import { oidcSettings } from './oidcConfig';

/**
 * Verifica a **requisição de autorização que sai de verdade**, não a config isolada.
 *
 * `OidcClient` monta a URL sem navegar, então dá para inspecionar os parâmetros que o Keycloak
 * receberia. É a diferença entre afirmar "configuramos S256" e provar que o parâmetro chega na URL —
 * a config poderia estar correta e a biblioteca ignorá-la por causa de outra opção.
 *
 * O `metadata` inline evita o discovery por rede: aqui interessa o que a lib gera a partir das
 * nossas settings, não se o Keycloak responde.
 */
const AUTORIZACAO = 'https://kc.exemplo/realms/menthoros/protocol/openid-connect/auth';
const FIM_DE_SESSAO = 'https://kc.exemplo/realms/menthoros/protocol/openid-connect/logout';

function clienteDeTeste() {
  return new OidcClient({
    ...oidcSettings,
    metadata: {
      issuer: 'https://kc.exemplo/realms/menthoros',
      authorization_endpoint: AUTORIZACAO,
      token_endpoint: 'https://kc.exemplo/realms/menthoros/protocol/openid-connect/token',
      end_session_endpoint: FIM_DE_SESSAO,
    },
  });
}

async function urlDeAutorizacao(state?: Record<string, unknown>): Promise<URL> {
  const req = await clienteDeTeste().createSigninRequest({ state });
  return new URL(req.url);
}

describe('requisição de autorização', () => {
  it('usa PKCE com S256', async () => {
    const url = await urlDeAutorizacao();

    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
  });

  /**
   * `organization` é optional client scope no `menthoros-web`. Sem ele o token sai sem `tenant_id`,
   * o `JwtTenantFilter` rejeita **toda** requisição autenticada e o app responde 403 — com o login
   * concluindo normalmente. É o modo de falha mais barato de introduzir e o mais caro de diagnosticar.
   */
  it('pede o scope organization', async () => {
    const url = await urlDeAutorizacao();

    expect(url.searchParams.get('scope')?.split(' ')).toContain('organization');
  });

  it('usa Authorization Code, não implícito', async () => {
    const url = await urlDeAutorizacao();

    expect(url.searchParams.get('response_type')).toBe('code');
  });

  it('retorna para a raiz, sem rota de callback sob o hash', async () => {
    const url = await urlDeAutorizacao();
    const redirect = url.searchParams.get('redirect_uri') ?? '';

    expect(redirect).toBe(`${window.location.origin}/`);
    expect(redirect).not.toContain('#');
  });

  /**
   * `state` liga a resposta ao pedido que a originou. Não se exige `nonce` aqui: a biblioteca não o
   * envia no Authorization Code puro, e faz sentido — o `nonce` protege o `id_token` contra replay,
   * enquanto o que protege este fluxo é o par `code_challenge`/`code_verifier`, coberto acima.
   */
  it('liga a resposta ao pedido com state', async () => {
    const url = await urlDeAutorizacao();

    expect(url.searchParams.get('state')).toBeTruthy();
  });

  // O destino viaja no state para o usuário voltar onde estava — não para a landing.
  it('carrega o destino no state do fluxo', async () => {
    const req = await clienteDeTeste().createSigninRequest({ state: { destino: '#/coach/inbox' } });

    expect((req.state.data as Record<string, unknown>).destino).toBe('#/coach/inbox');
  });

  it('encerra a sessão no provedor, não só localmente', async () => {
    const req = await clienteDeTeste().createSignoutRequest({});

    expect(req.url.startsWith(FIM_DE_SESSAO)).toBe(true);
  });
});
