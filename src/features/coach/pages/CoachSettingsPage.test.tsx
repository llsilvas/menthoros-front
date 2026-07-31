import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createHashRouter, RouterProvider } from 'react-router';
import * as reactRouter from 'react-router';
import CoachSettingsPage from './CoachSettingsPage';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof reactRouter>('react-router');
  return { ...actual, useOutletContext: vi.fn() };
});

const COACH = { id: 'c1', name: 'Leandro Silva', email: 'coach@exemplo.com', avatarUrl: 'https://kc/avatar.png' };
const CONSENT_ACEITO = {
  granted: true,
  policyVersion: '2026-06-30',
  termsVersion: '2026-06-30',
  consentedAt: '2026-07-31T19:23:43Z',
  acceptedPolicyVersion: '2026-06-30',
  acceptedTermsVersion: '2026-06-30',
};

const comContexto = (consent: Partial<typeof CONSENT_ACEITO> = CONSENT_ACEITO) => {
  vi.mocked(reactRouter.useOutletContext).mockReturnValue({
    coach: COACH,
    consent,
  } as unknown as CoachLayoutOutletContext);
  // Hash router de propósito: o app real roteia por hash, e um `href` absoluto já quebrou assim.
  const router = createHashRouter([{ path: '/', element: <CoachSettingsPage /> }]);
  render(<RouterProvider router={router} />);
};

describe('CoachSettingsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exibe nome, e-mail e avatar do coach (CA2)', () => {
    comContexto();

    expect(screen.getByText('Leandro Silva')).toBeInTheDocument();
    expect(screen.getByText('coach@exemplo.com')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /leandro silva/i })).toBeInTheDocument();
  });

  it('não oferece nenhum controle editável (CA2)', () => {
    comContexto();

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /salvar|editar/i })).not.toBeInTheDocument();
  });

  it('renderiza o avatar com referrerPolicy no-referrer', () => {
    comContexto();

    // A URL vem do Keycloak e é externa: sem isso o navegador vaza a rota interna do coach.
    expect(screen.getByRole('img', { name: /leandro silva/i }))
      .toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('exibe a data em pt-BR e AS DUAS versões aceitas (CA3)', () => {
    comContexto();

    expect(screen.getByText(/31\/07\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Política.*2026-06-30/i)).toBeInTheDocument();
    expect(screen.getByText(/Termos.*2026-06-30/i)).toBeInTheDocument();
  });

  it('sem aceite registrado, renderiza sem quebrar (CA4 — teste de componente)', () => {
    // Este estado é inalcançável pela UI: o CoachLayout bloqueia o Outlet quando falta
    // consentimento. A renderização defensiva existe porque o campo é nullable no contrato.
    comContexto({ granted: false, policyVersion: '2026-06-30', termsVersion: '2026-06-30' });

    expect(screen.getByText(/nenhum aceite registrado/i)).toBeInTheDocument();
  });

  it('sinaliza quando o aceite é de versão anterior à vigente', () => {
    comContexto({
      granted: false,
      policyVersion: '2027-01-01',
      termsVersion: '2027-01-01',
      consentedAt: '2026-07-31T19:23:43Z',
      acceptedPolicyVersion: '2026-06-30',
      acceptedTermsVersion: '2026-06-30',
    });

    expect(screen.getByText(/atualizad/i)).toBeInTheDocument();
  });

  it('a Política resolve como rota de hash, não caminho de servidor (CA5)', () => {
    comContexto();

    expect(screen.getByRole('link', { name: /política de privacidade/i }))
      .toHaveAttribute('href', '#/privacidade');
  });

  it('DPO e exclusão abrem mailto, a exclusão com assunto (CA5)', () => {
    comContexto();

    expect(screen.getByRole('link', { name: /falar com o encarregado/i }))
      .toHaveAttribute('href', 'mailto:contato@menthoros.com');
    expect(screen.getByRole('link', { name: /solicitar exclusão/i }).getAttribute('href'))
      .toMatch(/^mailto:contato@menthoros\.com\?subject=/);
  });

  it('avisa que a exclusão será confirmada por e-mail', () => {
    comContexto();

    // mailto não gera protocolo nem autentica quem envia; sem o aviso o coach assume que a conta
    // já foi excluída.
    expect(screen.getByText(/confirmada por e-mail/i)).toBeInTheDocument();
  });
});
