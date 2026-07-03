import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import LoginPage from './LoginPage';
import { useAuth } from '../../context/auth/useAuth';
import { useUserInfo } from '../../hooks/useUserInfo';
import { AuthService } from '../../services/auth/AuthService';

vi.mock('../../context/auth/useAuth');
vi.mock('../../hooks/useUserInfo');
vi.mock('../../services/auth/AuthService');

const loginMock = vi.fn();

function fakeToken(roles: string[]): string {
  const payload = { realm_access: { roles } };
  const base64url = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${base64url}.signature`;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/auth/login']}>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/athlete/home" element={<div>Shell do Atleta</div>} />
        <Route path="/inicio" element={<div>Início Neutro</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, login: loginMock, logout: vi.fn() });
    vi.mocked(useUserInfo).mockReturnValue({});
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
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, login: loginMock, logout: vi.fn() });
    vi.mocked(useUserInfo).mockReturnValue({ roles: ['ATLETA'] });
    renderLogin();

    expect(screen.getByText('Shell do Atleta')).toBeInTheDocument();
  });

  it('usuário já autenticado sem role ATLETA é redirecionado ao início neutro', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, login: loginMock, logout: vi.fn() });
    vi.mocked(useUserInfo).mockReturnValue({ roles: ['TECNICO'] });
    renderLogin();

    expect(screen.getByText('Início Neutro')).toBeInTheDocument();
  });
});
