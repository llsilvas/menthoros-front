import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import LoginPage from './LoginPage';
<<<<<<< HEAD
<<<<<<< HEAD
import { AuthProvider } from '../../context/auth/AuthProvider';
import { AuthService } from '../../services/auth/AuthService';

vi.mock('../../services/auth/AuthService');

const TOKEN_STORAGE_KEY = '@Menthoros:token';

/**
 * jsdom (env `about:blank` sem `environmentOptions.jsdom.url` configurado) não expõe
 * `window.localStorage` (origem opaca). Stub em memória só para este arquivo — necessário
 * porque o teste usa o `AuthProvider` real (não mockado) para exercitar a corrida entre o
 * `setIsAuthenticated(true)` do login e a leitura de `roles` no re-render do `LoginPage`.
 */
function stubLocalStorage() {
  let store: Record<string, string> = {};
  const mock: Storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  vi.stubGlobal('localStorage', mock);
}

function fakeToken(roles: string[]): string {
  const payload = {
    realm_access: { roles },
    exp: Math.floor(Date.now() / 1000) + 3600,
    tenantId: 'tenant-teste',
  };
=======
import { useAuth } from '../../context/auth/useAuth';
import { useUserInfo } from '../../hooks/useUserInfo';
=======
import { AuthProvider } from '../../context/auth/AuthProvider';
>>>>>>> 4ca6f5f (fix(athlete-shell): corrige corrida no redirecionamento pós-login por role)
import { AuthService } from '../../services/auth/AuthService';

vi.mock('../../services/auth/AuthService');

const TOKEN_STORAGE_KEY = '@Menthoros:token';

/**
 * jsdom (env `about:blank` sem `environmentOptions.jsdom.url` configurado) não expõe
 * `window.localStorage` (origem opaca). Stub em memória só para este arquivo — necessário
 * porque o teste usa o `AuthProvider` real (não mockado) para exercitar a corrida entre o
 * `setIsAuthenticated(true)` do login e a leitura de `roles` no re-render do `LoginPage`.
 */
function stubLocalStorage() {
  let store: Record<string, string> = {};
  const mock: Storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  vi.stubGlobal('localStorage', mock);
}

function fakeToken(roles: string[]): string {
<<<<<<< HEAD
  const payload = { realm_access: { roles } };
>>>>>>> e8b63e9 (feat(athlete-shell): redireciona atleta direto para /athlete/home após login)
=======
  const payload = {
    realm_access: { roles },
    exp: Math.floor(Date.now() / 1000) + 3600,
    tenantId: 'tenant-teste',
  };
>>>>>>> 4ca6f5f (fix(athlete-shell): corrige corrida no redirecionamento pós-login por role)
  const base64url = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${base64url}.signature`;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/auth/login']}>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4ca6f5f (fix(athlete-shell): corrige corrida no redirecionamento pós-login por role)
      <AuthProvider>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/athlete/home" element={<div>Shell do Atleta</div>} />
          <Route path="/inicio" element={<div>Início Neutro</div>} />
        </Routes>
      </AuthProvider>
<<<<<<< HEAD
=======
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/athlete/home" element={<div>Shell do Atleta</div>} />
        <Route path="/inicio" element={<div>Início Neutro</div>} />
      </Routes>
>>>>>>> e8b63e9 (feat(athlete-shell): redireciona atleta direto para /athlete/home após login)
=======
>>>>>>> 4ca6f5f (fix(athlete-shell): corrige corrida no redirecionamento pós-login por role)
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
<<<<<<< HEAD
<<<<<<< HEAD
    stubLocalStorage();
=======
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, login: loginMock, logout: vi.fn() });
    vi.mocked(useUserInfo).mockReturnValue({});
>>>>>>> e8b63e9 (feat(athlete-shell): redireciona atleta direto para /athlete/home após login)
=======
    stubLocalStorage();
>>>>>>> 4ca6f5f (fix(athlete-shell): corrige corrida no redirecionamento pós-login por role)
  });

  it('após login com role ATLETA, navega direto para /athlete/home', async () => {
    vi.mocked(AuthService.login).mockResolvedValue({ accessToken: fakeToken(['ATLETA']) });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email ou usuário/i), 'atleta@x.com');
    await user.type(screen.getByLabelText(/senha/i), 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Shell do Atleta')).toBeInTheDocument();
  });

  it('após login sem role ATLETA (coach/admin), navega para /inicio', async () => {
    vi.mocked(AuthService.login).mockResolvedValue({ accessToken: fakeToken(['TECNICO']) });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email ou usuário/i), 'coach@x.com');
    await user.type(screen.getByLabelText(/senha/i), 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Início Neutro')).toBeInTheDocument();
  });

  it('usuário já autenticado com role ATLETA é redirecionado direto ao shell do atleta', () => {
<<<<<<< HEAD
<<<<<<< HEAD
    localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken(['ATLETA']));
=======
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, login: loginMock, logout: vi.fn() });
    vi.mocked(useUserInfo).mockReturnValue({ roles: ['ATLETA'] });
>>>>>>> e8b63e9 (feat(athlete-shell): redireciona atleta direto para /athlete/home após login)
=======
    localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken(['ATLETA']));
>>>>>>> 4ca6f5f (fix(athlete-shell): corrige corrida no redirecionamento pós-login por role)
    renderLogin();

    expect(screen.getByText('Shell do Atleta')).toBeInTheDocument();
  });

  it('usuário já autenticado sem role ATLETA é redirecionado ao início neutro', () => {
<<<<<<< HEAD
<<<<<<< HEAD
    localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken(['TECNICO']));
=======
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, login: loginMock, logout: vi.fn() });
    vi.mocked(useUserInfo).mockReturnValue({ roles: ['TECNICO'] });
>>>>>>> e8b63e9 (feat(athlete-shell): redireciona atleta direto para /athlete/home após login)
=======
    localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken(['TECNICO']));
>>>>>>> 4ca6f5f (fix(athlete-shell): corrige corrida no redirecionamento pós-login por role)
    renderLogin();

    expect(screen.getByText('Início Neutro')).toBeInTheDocument();
  });
});
