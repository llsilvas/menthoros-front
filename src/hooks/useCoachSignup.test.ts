import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCoachSignup } from './useCoachSignup';

function resposta(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const ENTRADA = {
  nome: 'Maria',
  email: 'maria@exemplo.com',
  senha: 'senha-forte-o-suficiente',
  nomeAssessoria: 'Corrida na Serra',
  slug: 'corrida-na-serra',
};

describe('useCoachSignup', () => {
  let fetchSpy: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    fetchSpy = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('consultarConvite', () => {
    it('200 → valido, com nome e e-mail do inscrito', async () => {
      fetchSpy.mockResolvedValue(resposta(200, { nome: 'Maria', email: 'maria@exemplo.com' }));
      const { result } = renderHook(() => useCoachSignup());

      await act(async () => {
        await result.current.consultarConvite('tok-1');
      });

      expect(result.current.convite).toEqual({
        status: 'valido',
        dados: { nome: 'Maria', email: 'maria@exemplo.com' },
      });
      expect(fetchSpy.mock.calls[0][0]).toMatch(/\/api\/public\/founding-invites\/tok-1$/);
    });

    it('404 → invalido, sem dados', async () => {
      fetchSpy.mockResolvedValue(resposta(404));
      const { result } = renderHook(() => useCoachSignup());

      await act(async () => {
        await result.current.consultarConvite('tok-x');
      });

      expect(result.current.convite).toEqual({ status: 'invalido', dados: null });
    });

    it('falha de rede → invalido (não fica em carregando para sempre)', async () => {
      fetchSpy.mockRejectedValue(new TypeError('network'));
      const { result } = renderHook(() => useCoachSignup());

      await act(async () => {
        await result.current.consultarConvite('tok-x');
      });

      expect(result.current.convite.status).toBe('invalido');
    });

    it('o token vai codificado no path', async () => {
      fetchSpy.mockResolvedValue(resposta(200, { nome: 'M', email: 'm@x.io' }));
      const { result } = renderHook(() => useCoachSignup());

      await act(async () => {
        await result.current.consultarConvite('a b/c');
      });

      expect(fetchSpy.mock.calls[0][0]).toMatch(/founding-invites\/a%20b%2Fc$/);
    });
  });

  describe('cadastrar', () => {
    it('404 sem token → status fechado (cadastro por convite), sem mensagem de erro', async () => {
      fetchSpy.mockResolvedValue(resposta(404));
      const { result } = renderHook(() => useCoachSignup());

      await act(async () => {
        await result.current.cadastrar(ENTRADA);
      });

      expect(result.current.status).toBe('fechado');
      expect(result.current.error).toBeNull();
    });

    it('404 com token → erro de convite inválido, não "fechado"', async () => {
      fetchSpy.mockResolvedValue(resposta(404));
      const { result } = renderHook(() => useCoachSignup());

      await act(async () => {
        await result.current.cadastrar({ ...ENTRADA, inviteToken: 'tok-1' });
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toMatch(/convite não é mais válido/i);
    });

    it('422 com token → e-mail precisa ser o do convite', async () => {
      fetchSpy.mockResolvedValue(resposta(422));
      const { result } = renderHook(() => useCoachSignup());

      await act(async () => {
        await result.current.cadastrar({ ...ENTRADA, inviteToken: 'tok-1' });
      });

      expect(result.current.error).toMatch(/mesmo que recebeu o convite/i);
    });

    it('envia o inviteToken no corpo', async () => {
      fetchSpy.mockResolvedValue(resposta(201, { slug: 's', email: 'e', proximoPasso: 'p' }));
      const { result } = renderHook(() => useCoachSignup());

      await act(async () => {
        await result.current.cadastrar({ ...ENTRADA, inviteToken: 'tok-1' });
      });

      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      expect(body.inviteToken).toBe('tok-1');
    });
  });
});
