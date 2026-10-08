import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import WaitlistPage from './WaitlistPage';
import { WaitlistService } from '../../services/WaitlistService';

vi.mock('../../services/WaitlistService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/WaitlistService')>()),
  WaitlistService: { inscrever: vi.fn() },
}));

const inscreverMock = WaitlistService.inscrever as unknown as Mock;

function renderPage() {
  // Router REAL, não MemoryRouter: o app usa createHashRouter, e o MemoryRouter renderiza
  // href="/privacidade" em vez de "#/privacidade" — a asserção de link passaria em código
  // quebrado no browser (ver CLAUDE.md do front; o repo já perdeu um link assim).
  const router = createHashRouter([{ path: '/', element: <WaitlistPage /> }]);
  return render(<RouterProvider router={router} />);
}

async function selecionarPerfil(user: ReturnType<typeof userEvent.setup>, nome: RegExp) {
  await user.click(screen.getByRole('combobox', { name: 'Você é' }));
  await user.click(await screen.findByRole('option', { name: nome }));
}

describe('WaitlistPage', () => {
  beforeEach(() => {
    inscreverMock.mockReset();
    sessionStorage.clear();
  });

  it('não envia sem selecionar perfil nem aceitar a LGPD, e mostra os erros', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(inscreverMock).not.toHaveBeenCalled();
    expect(screen.getByText('Selecione uma opção.')).toBeInTheDocument();
    expect(screen.getByText('É preciso aceitar para continuar.')).toBeInTheDocument();
  });

  it('mostra o campo de quantidade de atletas apenas para treinador', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByRole('spinbutton', { name: 'Número de atletas' })).not.toBeInTheDocument();

    await selecionarPerfil(user, /treinador/i);
    expect(screen.getByRole('spinbutton', { name: 'Número de atletas' })).toBeInTheDocument();

    await selecionarPerfil(user, /^atleta$/i);
    expect(screen.queryByRole('spinbutton', { name: 'Número de atletas' })).not.toBeInTheDocument();
  });

  it('renderiza o honeypot oculto', () => {
    renderPage();
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).toBeTruthy();
    expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  });

  it('exibe a confirmação de treinador e esconde a proposta de valor e o painel ao enviar com sucesso', async () => {
    const user = userEvent.setup();
    inscreverMock.mockResolvedValue({ status: 'CRIADO', mensagem: 'ok' });
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'maria@exemplo.com');
    await selecionarPerfil(user, /treinador/i);
    await user.type(screen.getByRole('spinbutton', { name: 'Número de atletas' }), '15');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(await screen.findByText(/você está na fila/i)).toBeInTheDocument();
    expect(inscreverMock).toHaveBeenCalledOnce();
    expect(screen.queryByText(/fila de atenção/i)).not.toBeInTheDocument();
  });

  it('exibe a confirmação de atleta com CTA de compartilhar', async () => {
    const user = userEvent.setup();
    inscreverMock.mockResolvedValue({ status: 'CRIADO', mensagem: 'ok' });
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'João');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'joao@exemplo.com');
    await selecionarPerfil(user, /^atleta$/i);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(await screen.findByText(/avisa seu treinador/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copiar link/i })).toBeInTheDocument();
  });

  it('mostra erro e preserva os valores quando o envio falha', async () => {
    const user = userEvent.setup();
    inscreverMock.mockRejectedValue(new Error('falha'));
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'maria@exemplo.com');
    await selecionarPerfil(user, /^atleta$/i);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    // valores preservados (o formulário não é resetado em erro)
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Maria');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('maria@exemplo.com');
  });

  it('mostra a proposta de valor, a oferta e o aviso de Garmin acima do formulário', () => {
    renderPage();

    expect(screen.getByText(/IA para assessorias de corrida/i)).toBeInTheDocument();
    // "60 dias grátis, sem cartão" aparece duas vezes (proposta de valor + rodapé do form) — a
    // frase completa da oferta fundadora é única à ValueProposition.
    expect(screen.getByText(/Experimente o Menthoros por 60 dias grátis, sem cartão/i)).toBeInTheDocument();
    expect(screen.getAllByText(/R\$ 99\/mês/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Hoje o Menthoros lê dados de treino do/i)).toBeInTheDocument();
    expect(screen.getByText('Garmin')).toBeInTheDocument();
  });

  it('o link da Política fica FORA do label e com href de hash — dentro do label viraria toggle', () => {
    renderPage();

    const link = screen.getByRole('link', { name: /ler a política de privacidade/i });
    // href de hash: com MemoryRouter esta asserção passaria em código quebrado (CLAUDE.md).
    expect(link).toHaveAttribute('href', '#/privacidade');
    // A ESTRUTURA é o bug: um link dentro de <label> tem o clique encaminhado ao checkbox pelo
    // browser (nativo, stopPropagation não resolve) e nunca navega. Fora do label, navega.
    expect(link.closest('label')).toBeNull();
  });
});
