import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
 *
 * Em `fix-login-direct-keycloak-redirect` a tela deixou de esperar o clique: redireciona sozinha, e o
 * botão ficou só como fallback (erro, offline, retorno sem sessão).
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

const MARCA_LOGIN_DIRETO = 'menthoros:login-direto-tentado';

describe('LoginPage', () => {
  beforeEach(() => {
    limparUsuario();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // A tela com botão era um passo morto: sem sessão, a rota redireciona sozinha ao Keycloak.
  it('sem sessão, inicia o login sozinha — sem clique e sem mostrar o botão', async () => {
    const ctx = renderLogin({});

    await waitFor(() => expect(ctx.login).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: /entrar/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Redirecionando para o login')).toBeInTheDocument();
    // O ponto central da migração para PKCE continua valendo: a aplicação não vê a senha.
    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument();
  });

  // Sem isto, quem foi interrompido em #/coach/inbox volta para a raiz e cai na landing.
  it('preserva a rota que o guard interrompeu', async () => {
    const ctx = renderLogin({}, { de: '/coach/inbox' });

    await waitFor(() => expect(ctx.login).toHaveBeenCalledWith('#/coach/inbox'));
  });

  it('enquanto o estado de sessão é desconhecido, não redireciona nem mostra o botão', () => {
    const ctx = renderLogin({ carregando: true });

    expect(ctx.login).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /entrar/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Verificando sessão')).toBeInTheDocument();
  });

  describe('fallback manual', () => {
    it('falha ao iniciar o login mostra o erro e o botão para tentar de novo', async () => {
      const user = userEvent.setup();
      const login = vi.fn().mockRejectedValueOnce(new Error('provedor fora do ar'));
      renderLogin({ login });

      expect(await screen.findByRole('alert')).toHaveTextContent('provedor fora do ar');
      // A página não saiu do lugar: a marca não pode sobrar e travar a próxima entrada.
      expect(sessionStorage.getItem(MARCA_LOGIN_DIRETO)).toBeNull();

      login.mockResolvedValueOnce(undefined);
      await user.click(screen.getByRole('button', { name: /entrar/i }));
      expect(login).toHaveBeenCalledTimes(2);
    });

    // Offline, o redirect é navegação de página inteira e terminaria na página de erro do navegador.
    it('offline não redireciona sozinha; mostra o botão', () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      const ctx = renderLogin({});

      expect(ctx.login).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    // Voltar do Keycloak sem sessão e redirecionar de novo prenderia o navegador num vai-e-volta.
    it('retorno sem sessão após tentativa automática não redireciona de novo, e consome a marca', async () => {
      const user = userEvent.setup();
      sessionStorage.setItem(MARCA_LOGIN_DIRETO, '1');
      const ctx = renderLogin({});

      expect(ctx.login).not.toHaveBeenCalled();
      expect(sessionStorage.getItem(MARCA_LOGIN_DIRETO)).toBeNull();

      await user.click(screen.getByRole('button', { name: /entrar/i }));
      expect(ctx.login).toHaveBeenCalledTimes(1);
    });
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
