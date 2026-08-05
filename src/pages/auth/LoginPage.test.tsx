import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import LoginPage from './LoginPage';
import { AuthContext, type AuthContextData } from '../../context/auth/authContext';
import { definirUsuario, limparUsuario } from '../../context/auth/session';

/**
 * Reescrito na migração para Authorization Code + PKCE.
 *
 * A versão anterior exercitava o formulário de usuário/senha e o `AuthService` (ROPC), **removido do
 * repositório** na task 5.4 da change. Esse fluxo deixou de existir: a senha passou a ser digitada na
 * tela do Keycloak e nunca trafega pela aplicação. Os testes de destino por role continuam, porque a
 * regra é a mesma.
 */

function fakeToken(roles: string[]): string {
  const payload = {
    realm_access: { roles },
    exp: Math.floor(Date.now() / 1000) + 3600,
    tenantId: 'tenant-teste',
  };
  const base64url = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${base64url}.signature`;
}

function autenticarCom(roles: string[]) {
  definirUsuario({ access_token: fakeToken(roles) } as unknown as Parameters<
    typeof definirUsuario
  >[0]);
}

function renderLogin(ctx: Partial<AuthContextData>, estadoDaRota: unknown = undefined) {
  const valor: AuthContextData = {
    isAuthenticated: false,
    carregando: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...ctx,
  };

  render(
    <MemoryRouter initialEntries={[{ pathname: '/auth/login', state: estadoDaRota }]}>
      <AuthContext.Provider value={valor}>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/athlete/home" element={<div>Home do atleta</div>} />
          <Route path="/coach/inbox" element={<div>Inbox do coach</div>} />
          <Route path="/inicio" element={<div>Inicio neutro</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return valor;
}

describe('LoginPage', () => {
  beforeEach(() => {
    limparUsuario();
  });

  // O ponto central da migração: a aplicação não vê mais a senha do usuário.
  it('não coleta credenciais', () => {
    renderLogin({});

    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/usuário|email/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('dispara o fluxo de autorização ao clicar em Entrar', async () => {
    const user = userEvent.setup();
    const ctx = renderLogin({});

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(ctx.login).toHaveBeenCalledTimes(1);
  });

  // Sem isto, quem foi interrompido em #/coach/inbox volta para a raiz e cai na landing.
  it('preserva a rota que o guard interrompeu', async () => {
    const user = userEvent.setup();
    const ctx = renderLogin({}, { de: '/coach/inbox' });

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(ctx.login).toHaveBeenCalledWith('#/coach/inbox');
  });

  it('enquanto o estado de sessão é desconhecido, não mostra o botão', () => {
    renderLogin({ carregando: true });

    expect(screen.queryByRole('button', { name: /entrar/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Verificando sessão')).toBeInTheDocument();
  });

  describe('destino por role', () => {
    it('ATLETA vai para o shell do atleta', () => {
      autenticarCom(['ATLETA']);
      renderLogin({ isAuthenticated: true });

      expect(screen.getByText('Home do atleta')).toBeInTheDocument();
    });

    it('TECNICO vai para o inbox do coach', () => {
      autenticarCom(['TECNICO']);
      renderLogin({ isAuthenticated: true });

      expect(screen.getByText('Inbox do coach')).toBeInTheDocument();
    });

    it('ADMIN vai para o início neutro', () => {
      autenticarCom(['ADMIN']);
      renderLogin({ isAuthenticated: true });

      expect(screen.getByText('Inicio neutro')).toBeInTheDocument();
    });
  });
});
