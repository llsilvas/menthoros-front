import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLogoAssessoria } from './useLogoAssessoria';

vi.mock('../context/auth/session', () => ({
  getAccessTokenSync: () => 'token-de-teste',
  getTenantId: () => 'tenant-1',
}));

const criarObjectURL = vi.fn(() => 'blob:logo');
const revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('URL', { ...URL, createObjectURL: criarObjectURL, revokeObjectURL });
});

function mockarFetch(ok: boolean) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, blob: async () => new Blob(['x']) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useLogoAssessoria', () => {
  /**
   * O ponto da existência do hook: `<img src>` não manda `Authorization`, e a rota da logo exige
   * JWT. Sem buscar a imagem com o token, o servidor responde 403 e a logo nunca aparece — que era
   * exatamente o sintoma relatado ("enviei e não carrega").
   */
  it('busca a imagem com o token no header', async () => {
    const fetchMock = mockarFetch(true);

    renderHook(() => useLogoAssessoria('/api/v1/assessorias/me/logo', 4));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer token-de-teste');
    expect(init.headers['X-Tenant-ID']).toBe('tenant-1');
  });

  it('devolve um object URL utilizável no src', async () => {
    mockarFetch(true);

    const { result } = renderHook(() => useLogoAssessoria('/api/v1/assessorias/me/logo', 4));

    await waitFor(() => expect(result.current).toBe('blob:logo'));
  });

  /** A URL da rota é fixa; sem a versão na query, o navegador serviria a imagem antiga. */
  it('inclui a versão como cache-bust', async () => {
    const fetchMock = mockarFetch(true);

    renderHook(() => useLogoAssessoria('/api/v1/assessorias/me/logo', 7));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(String(fetchMock.mock.calls[0][0])).toContain('?v=7');
  });

  it('sem rota, não busca nada', () => {
    const fetchMock = mockarFetch(true);

    const { result } = renderHook(() => useLogoAssessoria(null));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('resposta de erro não vira src quebrado', async () => {
    mockarFetch(false);

    const { result } = renderHook(() => useLogoAssessoria('/api/v1/assessorias/me/logo', 1));

    await waitFor(() => expect(criarObjectURL).not.toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  /** Cada troca de logo criaria um blob novo; sem revogar, todos ficam na memória da aba. */
  it('revoga o object URL ao desmontar', async () => {
    mockarFetch(true);

    const { result, unmount } = renderHook(() => useLogoAssessoria('/api/v1/assessorias/me/logo', 1));
    await waitFor(() => expect(result.current).toBe('blob:logo'));

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:logo');
  });
});
