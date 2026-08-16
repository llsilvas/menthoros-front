import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CoachSidebar from './CoachSidebar';

// O `LogoutButton` da sidebar consome o AuthProvider; este teste é sobre a logo, não sobre sessão.
vi.mock('../../../shared/components/LogoutButton', () => ({
  LogoutButton: () => <button type="button">sair</button>,
}));

const COACH = { id: 'c1', name: 'Coach Teste' };

function montar(tenant: Partial<{ id: string; name: string; athleteCount: number; logoUrl: string | null; version: number }> = {}) {
  render(
    <CoachSidebar
      activeRoute="/coach/inbox"
      coach={COACH}
      currentTenant={{ id: 't1', name: 'Corridas Serra', athleteCount: 4, ...tenant }}
      onNavigate={vi.fn()}
    />,
  );
}

describe('CoachSidebar — logo da assessoria', () => {
  /**
   * O bug que a change corrige: o upload funcionava, o logo persistia, e a shell continuava
   * mostrando iniciais e a marca Menthoros — porque nem o `me` expunha o logo nem a sidebar o lia.
   */
  it('com logo, exibe a imagem da assessoria', () => {
    montar({ logoUrl: '/api/v1/assessorias/me/logo', version: 3 });

    const logos = screen.getAllByAltText(/corridas serra/i);
    expect(logos.length).toBeGreaterThan(0);
  });

  /** A URL da logo é fixa; sem cache-bust o navegador serve a imagem antiga após a troca. */
  it('a URL da logo carrega a versão como cache-bust', () => {
    montar({ logoUrl: '/api/v1/assessorias/me/logo', version: 3 });

    const logo = screen.getAllByAltText(/corridas serra/i)[0];
    expect(logo.getAttribute('src')).toMatch(/\/api\/v1\/assessorias\/me\/logo\?v=3$/);
  });

  it('sem logo, mantém as iniciais do tenant', () => {
    montar({ logoUrl: null });

    expect(screen.getByText('CO')).toBeInTheDocument();
    expect(screen.queryByAltText(/corridas serra/i)).not.toBeInTheDocument();
  });

  it('sem logo, o header mantém a marca Menthoros', () => {
    montar({ logoUrl: null });

    expect(screen.getByAltText(/menthoros/i)).toBeInTheDocument();
  });

  /**
   * White-label: quem atende o atleta é a assessoria. Com logo, ela ocupa o lugar da marca do
   * produto no header — e volta para a marca se não houver logo ou se a imagem falhar.
   */
  it('com logo, o header exibe a marca da assessoria no lugar da Menthoros', () => {
    montar({ logoUrl: '/api/v1/assessorias/me/logo', version: 2 });

    expect(screen.queryByAltText(/menthoros/i)).not.toBeInTheDocument();
    expect(screen.getAllByAltText(/corridas serra/i).length).toBeGreaterThanOrEqual(2);
  });
});
