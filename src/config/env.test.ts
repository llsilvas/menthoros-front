import { afterEach, describe, expect, it, vi } from 'vitest';

// env.ts lê window.__RUNTIME_CONFIG__ no momento do import, então cada caso
// precisa de um módulo fresco.
async function loadRuntimeConfig(runtime?: Window['__RUNTIME_CONFIG__']) {
  vi.resetModules();
  window.__RUNTIME_CONFIG__ = runtime;
  const mod = await import('./env');
  return mod.runtimeConfig;
}

describe('runtimeConfig.keycloakUrl', () => {
  afterEach(() => {
    delete window.__RUNTIME_CONFIG__;
    vi.unstubAllEnvs();
  });

  it('usa a URL injetada em runtime quando presente', async () => {
    const cfg = await loadRuntimeConfig({ keycloakUrl: 'https://auth.menthoros.com' });
    expect(cfg.keycloakUrl).toBe('https://auth.menthoros.com');
  });

  it('ignora o placeholder não substituído', async () => {
    vi.stubEnv('VITE_KEYCLOAK_URL', '');
    const cfg = await loadRuntimeConfig({ keycloakUrl: '__RUNTIME_KEYCLOAK_URL_PLACEHOLDER__' });
    expect(cfg.keycloakUrl).toBe('/auth');
  });

  it('trata string vazia (var ausente no container) como ausente e cai no /auth', async () => {
    // docker-entrypoint.sh injeta "${VITE_KEYCLOAK_URL-}": sem a var, o env-config.js
    // fica com keycloakUrl: "" — e "" não é nullish, então ?? sozinho não protege.
    vi.stubEnv('VITE_KEYCLOAK_URL', '');
    const cfg = await loadRuntimeConfig({ keycloakUrl: '' });
    expect(cfg.keycloakUrl).toBe('/auth');
  });

  it('sem runtime config, usa VITE_KEYCLOAK_URL do build', async () => {
    vi.stubEnv('VITE_KEYCLOAK_URL', 'http://localhost:8080');
    const cfg = await loadRuntimeConfig(undefined);
    expect(cfg.keycloakUrl).toBe('http://localhost:8080');
  });
});

describe('runtimeConfig.garminHabilitado', () => {
  afterEach(() => {
    delete window.__RUNTIME_CONFIG__;
    vi.unstubAllEnvs();
  });

  it('desligada quando a var está ausente', async () => {
    vi.stubEnv('VITE_GARMIN_HABILITADO', '');
    const cfg = await loadRuntimeConfig(undefined);
    expect(cfg.garminHabilitado).toBe(false);
  });

  it('desligada com o placeholder não substituído ou string vazia', async () => {
    vi.stubEnv('VITE_GARMIN_HABILITADO', '');
    expect((await loadRuntimeConfig({ garminHabilitado: '__RUNTIME_GARMIN_HABILITADO_PLACEHOLDER__' })).garminHabilitado).toBe(false);
    expect((await loadRuntimeConfig({ garminHabilitado: '' })).garminHabilitado).toBe(false);
  });

  it('ligada com "true" no build', async () => {
    vi.stubEnv('VITE_GARMIN_HABILITADO', 'true');
    const cfg = await loadRuntimeConfig(undefined);
    expect(cfg.garminHabilitado).toBe(true);
  });

  it('ligada com "true" injetado em runtime', async () => {
    vi.stubEnv('VITE_GARMIN_HABILITADO', '');
    const cfg = await loadRuntimeConfig({ garminHabilitado: 'true' });
    expect(cfg.garminHabilitado).toBe(true);
  });

  it('runtime "false" desliga mesmo com "true" no build (o Railway desliga sem rebuild)', async () => {
    vi.stubEnv('VITE_GARMIN_HABILITADO', 'true');
    const cfg = await loadRuntimeConfig({ garminHabilitado: 'false' });
    expect(cfg.garminHabilitado).toBe(false);
  });

  it('runtime vazio ou placeholder cai no valor do build', async () => {
    vi.stubEnv('VITE_GARMIN_HABILITADO', 'true');
    expect((await loadRuntimeConfig({ garminHabilitado: '' })).garminHabilitado).toBe(true);
    expect((await loadRuntimeConfig({ garminHabilitado: '__RUNTIME_GARMIN_HABILITADO_PLACEHOLDER__' })).garminHabilitado).toBe(true);
  });
});
