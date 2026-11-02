import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CoachSidebar from './CoachSidebar';

/*
  A logo é buscada com o token e servida como `blob:` — a rota exige JWT e `<img src>` não envia
  `Authorization`. Aqui o hook é mockado: o que este teste cobre é a decisão de exibir logo ou
  fallback; a busca autenticada e o cache-bust têm teste próprio em `useLogoAssessoria.test.ts`.
*/
vi.mock('../../../hooks/useLogoAssessoria', () => ({
  useLogoAssessoria: (rota: string | null | undefined) => (rota ? 'blob:logo-de-teste' : null),
}));

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

  /** O `src` é um object URL, não a rota: apontar direto para ela resultaria em 403. */
  it('a imagem usa o object URL produzido pela busca autenticada', () => {
    montar({ logoUrl: '/api/v1/assessorias/me/logo', version: 3 });

    const logo = screen.getAllByAltText(/corridas serra/i)[0];
    expect(logo.getAttribute('src')).toBe('blob:logo-de-teste');
    expect(logo.getAttribute('src')).not.toContain('/api/v1/');
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

  /** A marca do header é sempre a Menthoros; a logo da assessoria aparece só no seletor de tenant. */
  it('com logo da assessoria, o header continua exibindo a marca Menthoros', () => {
    montar({ logoUrl: '/api/v1/assessorias/me/logo', version: 2 });

    expect(screen.getByAltText(/menthoros/i)).toBeInTheDocument();
    expect(screen.getAllByAltText(/corridas serra/i).length).toBeGreaterThanOrEqual(1);
  });
});
