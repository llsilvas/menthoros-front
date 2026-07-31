import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoachConsentDialog } from './CoachConsentDialog';

const VERSOES = { policyVersion: '2026-06-30', termsVersion: '2026-06-30' };

const renderDialog = (props: Partial<React.ComponentProps<typeof CoachConsentDialog>> = {}) => {
  const onAccept = vi.fn().mockResolvedValue(undefined);
  render(<CoachConsentDialog open {...VERSOES} onAccept={onAccept} {...props} />);
  return { onAccept };
};

const botaoAceitar = () => screen.getByRole('button', { name: /aceitar e continuar/i });

describe('CoachConsentDialog', () => {
  it('mantém o botão desabilitado enquanto nenhum checkbox está marcado', () => {
    renderDialog();

    expect(botaoAceitar()).toBeDisabled();
  });

  it('mantém o botão desabilitado com apenas um dos dois aceites', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('checkbox', { name: /termos de uso/i }));

    expect(botaoAceitar()).toBeDisabled();
  });

  it('habilita o botão apenas com os dois aceites marcados', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('checkbox', { name: /termos de uso/i }));
    await user.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));

    expect(botaoAceitar()).toBeEnabled();
  });

  it('envia as versões recebidas por prop, não constantes locais', async () => {
    const user = userEvent.setup();
    const { onAccept } = renderDialog({
      policyVersion: '2027-01-15',
      termsVersion: '2027-02-20',
    });

    await user.click(screen.getByRole('checkbox', { name: /termos de uso/i }));
    await user.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));
    await user.click(botaoAceitar());

    await waitFor(() =>
      expect(onAccept).toHaveBeenCalledWith({
        policyVersion: '2027-01-15',
        termsVersion: '2027-02-20',
      }),
    );
  });

  it('não oferece nenhuma forma de dispensar o modal', () => {
    renderDialog();

    // Sem botão de fechar e sem "cancelar": o consentimento não é opcional.
    expect(screen.queryByRole('button', { name: /fechar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it('aponta a Política para /privacidade', () => {
    renderDialog();

    expect(screen.getByRole('link', { name: /política de privacidade/i }))
      .toHaveAttribute('href', '/privacidade');
  });

  it('exibe mensagem de erro quando o aceite falha', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn().mockRejectedValue(new Error('falhou'));
    render(<CoachConsentDialog open {...VERSOES} onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox', { name: /termos de uso/i }));
    await user.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));
    await user.click(botaoAceitar());

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('avisa que os termos mudaram quando o backend recusa a versão', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn().mockRejectedValue({ status: 409, body: { code: 'CONSENT_VERSION_STALE' } });
    render(<CoachConsentDialog open {...VERSOES} onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox', { name: /termos de uso/i }));
    await user.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));
    await user.click(botaoAceitar());

    expect(await screen.findByRole('alert')).toHaveTextContent(/atualizad/i);
  });

  it('desmarca os aceites após versão defasada, para o usuário reler o texto novo', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn().mockRejectedValue({ status: 409, body: { code: 'CONSENT_VERSION_STALE' } });
    render(<CoachConsentDialog open {...VERSOES} onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox', { name: /termos de uso/i }));
    await user.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));
    await user.click(botaoAceitar());

    await screen.findByRole('alert');
    expect(botaoAceitar()).toBeDisabled();
  });
});
