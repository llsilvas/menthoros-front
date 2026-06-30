import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import WaitlistPage from './WaitlistPage';
import { WaitlistService } from '../../services/WaitlistService';

vi.mock('../../services/WaitlistService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/WaitlistService')>()),
  WaitlistService: { inscrever: vi.fn() },
}));

const inscreverMock = WaitlistService.inscrever as unknown as Mock;

function renderPage() {
  return render(
    <MemoryRouter>
      <WaitlistPage />
    </MemoryRouter>,
  );
}

async function selecionarPerfil(user: ReturnType<typeof userEvent.setup>, nome: RegExp) {
  await user.click(screen.getByRole('combobox', { name: 'Você é' }));
  await user.click(await screen.findByRole('option', { name: nome }));
}

describe('WaitlistPage', () => {
  beforeEach(() => {
    inscreverMock.mockReset();
  });

  it('mantém o envio desabilitado até selecionar perfil e aceitar a LGPD', async () => {
    const user = userEvent.setup();
    renderPage();

    const submit = screen.getByRole('button', { name: /entrar na lista/i });
    expect(submit).toBeDisabled();

    await selecionarPerfil(user, /^atleta$/i);
    expect(submit).toBeDisabled(); // ainda falta o aceite LGPD

    await user.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();
  });

  it('mostra o campo de quantidade de atletas apenas para treinador', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByRole('combobox', { name: /quantos atletas/i })).not.toBeInTheDocument();

    await selecionarPerfil(user, /treinador/i);
    expect(screen.getByRole('combobox', { name: /quantos atletas/i })).toBeInTheDocument();

    await selecionarPerfil(user, /^atleta$/i);
    expect(screen.queryByRole('combobox', { name: /quantos atletas/i })).not.toBeInTheDocument();
  });

  it('renderiza o honeypot oculto', () => {
    renderPage();
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).toBeTruthy();
    expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  });

  it('exibe a confirmação ao enviar com sucesso', async () => {
    const user = userEvent.setup();
    inscreverMock.mockResolvedValue({ status: 'CRIADO', mensagem: 'ok' });
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'maria@exemplo.com');
    await selecionarPerfil(user, /treinador/i);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /entrar na lista/i }));

    expect(await screen.findByText(/você está na lista/i)).toBeInTheDocument();
    expect(inscreverMock).toHaveBeenCalledOnce();
  });

  it('mostra erro e preserva os valores quando o envio falha', async () => {
    const user = userEvent.setup();
    inscreverMock.mockRejectedValue(new Error('falha'));
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'maria@exemplo.com');
    await selecionarPerfil(user, /^atleta$/i);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /entrar na lista/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    // valores preservados (o formulário não é resetado em erro)
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Maria');
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveValue('maria@exemplo.com');
  });
});
