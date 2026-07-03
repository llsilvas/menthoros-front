import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import RoleRoute from './RoleRoute';
import { useUserInfo } from '../../hooks/useUserInfo';

vi.mock('../../hooks/useUserInfo');

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/athlete" element={<RoleRoute allow={['ATLETA']} />}>
          <Route path="home" element={<div>Shell do Atleta</div>} />
        </Route>
        <Route path="/inicio" element={<div>Início Neutro</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoleRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deixa o ATLETA acessar o shell', () => {
    vi.mocked(useUserInfo).mockReturnValue({ roles: ['ATLETA'] });
    renderAt('/athlete/home');
    expect(screen.getByText('Shell do Atleta')).toBeInTheDocument();
  });

  it('redireciona coach/admin para o início', () => {
    vi.mocked(useUserInfo).mockReturnValue({ roles: ['TECNICO', 'ADMIN'] });
    renderAt('/athlete/home');
    expect(screen.getByText('Início Neutro')).toBeInTheDocument();
    expect(screen.queryByText('Shell do Atleta')).toBeNull();
  });

  it('redireciona quando não há roles', () => {
    vi.mocked(useUserInfo).mockReturnValue({});
    renderAt('/athlete/home');
    expect(screen.getByText('Início Neutro')).toBeInTheDocument();
  });
});
