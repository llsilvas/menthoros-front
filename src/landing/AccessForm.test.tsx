import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AccessForm } from './AccessForm';
import type { WaitlistStatus } from '../hooks/useWaitlist';

let mockStatus: WaitlistStatus = 'idle';
let mockError: string | null = null;
const inscreverMock = vi.fn();

vi.mock('../hooks/useWaitlist', () => ({
  useWaitlist: () => ({ status: mockStatus, error: mockError, inscrever: inscreverMock }),
}));

function renderForm() {
  return render(
    <MemoryRouter>
      <AccessForm />
    </MemoryRouter>,
  );
}

describe('AccessForm', () => {
  beforeEach(() => {
    mockStatus = 'idle';
    mockError = null;
    inscreverMock.mockReset();
  });

  it('mantém o envio desabilitado até aceitar a LGPD', async () => {
    const user = userEvent.setup();
    renderForm();

    const submit = screen.getByRole('button', { name: /solicitar acesso/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();
  });

  it('valida os campos e não envia quando inválidos', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('checkbox')); // habilita o submit
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(screen.getByText('Informe seu nome.')).toBeInTheDocument();
    expect(screen.getByText('Informe um email válido.')).toBeInTheDocument();
    expect(inscreverMock).not.toHaveBeenCalled();
  });

  it('envia o payload completo com a faixa mapeada e perfil TREINADOR', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'maria@exemplo.com');
    await user.type(screen.getByRole('spinbutton', { name: 'Número de atletas' }), '15');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(inscreverMock).toHaveBeenCalledTimes(1);
    expect(inscreverMock).toHaveBeenCalledWith({
      nome: 'Maria',
      email: 'maria@exemplo.com',
      perfil: 'TREINADOR',
      qtdAtletas: 'DE_11_A_30',
      aceiteLgpd: true,
      website: undefined,
    });
  });

  it('mostra erro do hook e preserva os valores digitados', async () => {
    mockStatus = 'error';
    mockError = 'Não foi possível concluir agora. Tente novamente em instantes.';
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');

    expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível/i);
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Maria');
  });

  it('exibe a confirmação quando o status é success', () => {
    mockStatus = 'success';
    renderForm();
    expect(screen.getByText(/inscrição recebida/i)).toBeInTheDocument();
  });

  it('renderiza o honeypot oculto', () => {
    renderForm();
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).toBeTruthy();
    expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  });
});
