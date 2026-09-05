import { afterEach, describe, expect, it } from 'vitest';
import {
  guardarTokenEmMemoria,
  haConvitePendente,
  limparTokenEmMemoria,
} from './inviteTokenFragment';

/**
 * `haConvitePendente` é o predicado que o AuthProvider usa para PULAR a restauração silenciosa de
 * sessão (redirect de página inteira que destruiria o token). Errar para `true` fora do cadastro
 * desligaria a restauração de quem tem sessão (UX-DoS forjável por URL); errar para `false` no
 * cadastro destrói o convite. Ver o guard em `AuthProvider` — coberto ponta a ponta pelo E2E
 * `convite-atleta.spec.ts`.
 */
describe('haConvitePendente', () => {
  afterEach(() => {
    limparTokenEmMemoria();
    window.history.replaceState(null, '', '#/');
  });

  it('true com token no fragmento da rota de cadastro', () => {
    window.history.replaceState(null, '', '#/cadastro?convite=tok-1');

    expect(haConvitePendente()).toBe(true);
  });

  it('true com token só na memória (pós-remoção da URL), ainda no cadastro', () => {
    window.history.replaceState(null, '', '#/cadastro');
    guardarTokenEmMemoria('tok-1');

    expect(haConvitePendente()).toBe(true);
  });

  it('false sem token nenhum', () => {
    window.history.replaceState(null, '', '#/cadastro');

    expect(haConvitePendente()).toBe(false);
  });

  it('false com ?convite= forjado FORA do cadastro — não desliga a restauração de quem tem sessão', () => {
    window.history.replaceState(null, '', '#/dashboard?convite=forjado');

    expect(haConvitePendente()).toBe(false);
  });

  it('false fora do cadastro mesmo com token residual na memória', () => {
    guardarTokenEmMemoria('tok-1');
    window.history.replaceState(null, '', '#/dashboard');

    expect(haConvitePendente()).toBe(false);
  });
});
