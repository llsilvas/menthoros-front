import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import CoachLayout from './CoachLayout';
import type { CurrentConsent } from '../../../hooks/useCurrentUser';

const fetchCurrentUser = vi.fn().mockResolvedValue(undefined);
const registrarConsentimento = vi.fn().mockResolvedValue(undefined);
const VERSOES = { policyVersion: '2026-06-30', termsVersion: '2026-06-30' };
let consentAtual: CurrentConsent = { granted: true, ...VERSOES };
let loadingAtual = false;
let errorAtual: Error | null = null;

vi.mock('../../../hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    coach: { id: 'c1', name: 'Coach' },
    tenant: { id: 't1', name: 'Assessoria', athleteCount: 0 },
    consent: consentAtual,
    loading: loadingAtual,
    error: errorAtual,
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
    consentAtual = { granted: true, ...VERSOES };
    loadingAtual = false;
    errorAtual = null;
  });

  it('renderiza o shell normal quando o consentimento está em dia', () => {
    renderLayout();

    expect(screen.queryByRole('button', { name: /aceitar e continuar/i })).not.toBeInTheDocument();
  });

  it('substitui o shell pelo modal quando falta consentimento', () => {
    consentAtual = { granted: false, ...VERSOES };

    renderLayout();

    expect(screen.getByRole('button', { name: /aceitar e continuar/i })).toBeInTheDocument();
    // A sidebar não deve ser renderizada: o coach não navega antes de aceitar.
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  // Enquanto `me` não respondeu não pode aparecer nem o modal (piscaria a cada carregamento) nem o
  // shell (a sidebar e os fetches da fila rodariam antes de saber se o coach consentiu — com
  // enforcement ligado voltariam 403 e o coach veria erro cru no lugar do gate).
  it('não exibe modal nem shell enquanto o consentimento é indefinido', () => {
    consentAtual = { granted: null, ...VERSOES };

    renderLayout();

    expect(screen.queryByRole('button', { name: /aceitar e continuar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  // Regressão: com o gate de loading, uma falha no `me` deixava loading=false e granted=null,
  // prendendo o coach num spinner para sempre — sem mensagem e sem como tentar de novo.
  it('mostra erro com retry quando `me` falha, em vez de spinner infinito', async () => {
    errorAtual = new Error('falhou');
    const user = userEvent.setup();
    renderLayout();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /tentar de novo/i }));
    expect(fetchCurrentUser).toHaveBeenCalled();
  });

  it('não renderiza o shell enquanto `me` está carregando', () => {
    loadingAtual = true;

    renderLayout();

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aceitar e continuar/i })).not.toBeInTheDocument();
  });

  it('após aceitar, registra e revalida o usuário para liberar a navegação', async () => {
    consentAtual = { granted: false, ...VERSOES };
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
