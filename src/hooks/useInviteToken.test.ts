import { afterEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { lerTokenDoFragmento, limparTokenEmMemoria, removerTokenDoFragmento, useInviteToken } from './useInviteToken';

describe('useInviteToken', () => {
  afterEach(() => {
    limparTokenEmMemoria();
    window.history.replaceState(null, '', window.location.pathname);
  });

  describe('lerTokenDoFragmento', () => {
    it('lê o token do fragmento', () => {
      window.history.replaceState(null, '', '#/cadastro?convite=abc_DEF-123');

      expect(lerTokenDoFragmento()).toBe('abc_DEF-123');
    });

    it('sem query → null', () => {
      window.history.replaceState(null, '', '#/cadastro');

      expect(lerTokenDoFragmento()).toBeNull();
    });

    it('token vazio ou em branco → null', () => {
      window.history.replaceState(null, '', '#/cadastro?convite=%20%20');

      expect(lerTokenDoFragmento()).toBeNull();
    });

    it('divide na PRIMEIRA ? — uma segunda ? faz parte da query, não some', () => {
      window.history.replaceState(null, '', '#/cadastro?convite=tok?x=1');

      expect(lerTokenDoFragmento()).toBe('tok?x=1');
    });
  });

  describe('removerTokenDoFragmento', () => {
    it('remove só o token, preservando os outros parâmetros', () => {
      window.history.replaceState(null, '', '#/cadastro?utm=x&convite=tok&y=2');

      removerTokenDoFragmento();

      expect(window.location.hash).toBe('#/cadastro?utm=x&y=2');
    });

    it('sem outros parâmetros, deixa só o caminho', () => {
      window.history.replaceState(null, '', '#/cadastro?convite=tok');

      removerTokenDoFragmento();

      expect(window.location.hash).toBe('#/cadastro');
    });

    it('sem token é no-op — idempotente sob StrictMode', () => {
      window.history.replaceState(null, '', '#/cadastro?utm=x');

      removerTokenDoFragmento();
      removerTokenDoFragmento();

      expect(window.location.hash).toBe('#/cadastro?utm=x');
    });
  });

  it('o hook devolve o token e limpa a URL no mount', () => {
    window.history.replaceState(null, '', '#/cadastro?convite=tok-secreto');

    const { result } = renderHook(() => useInviteToken());

    expect(result.current).toBe('tok-secreto');
    expect(window.location.hash).toBe('#/cadastro');
  });

  it('sem token o hook devolve null e não mexe na URL', () => {
    window.history.replaceState(null, '', '#/cadastro?utm=x');

    const { result } = renderHook(() => useInviteToken());

    expect(result.current).toBeNull();
    expect(window.location.hash).toBe('#/cadastro?utm=x');
  });
});
