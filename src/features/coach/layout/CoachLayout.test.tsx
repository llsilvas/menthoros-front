import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import CoachLayout from './CoachLayout';
import type { CurrentConsent } from '../../../hooks/useCurrentUser';

const fetchCurrentUser = vi.fn().mockResolvedValue(undefined);
const registrarConsentimento = vi.fn().mockResolvedValue(undefined);
let consentAtual: CurrentConsent = { granted: true };

vi.mock('../../../hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    coach: { id: 'c1', name: 'Coach' },
    tenant: { id: 't1', name: 'Assessoria', athleteCount: 0 },
    consent: consentAtual,
    loading: false,
    error: null,
    fetchCurrentUser,
  }),
}));

vi.mock('../../../hooks/useAttentionQueue', () => ({
  useAttentionQueue: () => ({ queue: [], loading: false, error: null, fetchQueue: vi.fn() }),
}));

vi.mock('../../../hooks/useCoachPlanReview', () => ({
  useCoachPlanReview: () => ({
    allPlanos: [], pendentes: [], activeFilter: 'TODOS', setFilter: vi.fn(),
    isFetching: false, isActing: false, fetchError: null, actionError: null,
    fetchPendentes: vi.fn(), aprovar: vi.fn(), rejeitar: vi.fn(),
  }),
}));

vi.mock('../../../api/services/UsuarioService', () => ({
  UsuarioService: { registrarConsentimento: (...args: unknown[]) => registrarConsentimento(...args) },
}));

// A sidebar real lê `localStorage` no mount, que não existe neste ambiente de teste. O objeto de
// teste aqui é o gate do layout, não a sidebar — o stub preserva a única coisa que as asserções
// precisam: se o shell navegável foi renderizado ou não.
vi.mock('./CoachSidebar', () => ({
  default: () => <nav aria-label="Navegação do coach" />,
}));

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/coach/inbox']}>
      <CoachLayout />
    </MemoryRouter>,
  );

describe('CoachLayout — gate de consentimento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consentAtual = { granted: true };
  });

  it('renderiza o shell normal quando o consentimento está em dia', () => {
    renderLayout();

    expect(screen.queryByRole('button', { name: /aceitar e continuar/i })).not.toBeInTheDocument();
  });

  it('substitui o shell pelo modal quando falta consentimento', () => {
    consentAtual = { granted: false, policyVersion: '2026-06-30', termsVersion: '2026-06-30' };

    renderLayout();

    expect(screen.getByRole('button', { name: /aceitar e continuar/i })).toBeInTheDocument();
    // A sidebar não deve ser renderizada: o coach não navega antes de aceitar.
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('não exibe o modal enquanto o consentimento é indefinido (me ainda carregando)', () => {
    consentAtual = { granted: null };

    renderLayout();

    expect(screen.queryByRole('button', { name: /aceitar e continuar/i })).not.toBeInTheDocument();
  });

  it('após aceitar, registra e revalida o usuário para liberar a navegação', async () => {
    consentAtual = { granted: false, policyVersion: '2026-06-30', termsVersion: '2026-06-30' };
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole('checkbox', { name: /termos de uso/i }));
    await user.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));
    await user.click(screen.getByRole('button', { name: /aceitar e continuar/i }));

    await waitFor(() =>
      expect(registrarConsentimento).toHaveBeenCalledWith({
        termsAccepted: true,
        privacyPolicyAccepted: true,
        policyVersion: '2026-06-30',
        termsVersion: '2026-06-30',
      }),
    );
    // O refetch é o que libera o shell — sem ele o modal ficaria preso mesmo após o 200.
    await waitFor(() => expect(fetchCurrentUser).toHaveBeenCalledTimes(2));
  });
});
