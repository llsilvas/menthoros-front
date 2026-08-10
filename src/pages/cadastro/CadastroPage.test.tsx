import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import CadastroPage from './CadastroPage';

const login = vi.fn();
vi.mock('../../context/auth/useAuth', () => ({
  useAuth: () => ({ login }),
}));

/**
 * Router REAL, não `MemoryRouter`: o app usa `createHashRouter`, e o MemoryRouter renderiza
 * `href="/termos"` em vez de `href="#/termos"` — uma asserção de href passaria em código que
 * está quebrado no browser. O repo já perdeu um link assim (ver CLAUDE.md do frontend).
 */
function renderizar() {
  const router = createHashRouter([{ path: '/', element: <CadastroPage /> }]);
  return render(<RouterProvider router={router} />);
}

/** Preenche o formulário com dados válidos, deixando o slug ser sugerido. */
async function preencher(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/seu nome/i), 'Maria Treinadora');
  await user.type(screen.getByLabelText(/seu e-mail/i), 'maria@exemplo.com');
  await user.type(screen.getByLabelText(/^senha/i), 'senha-forte-o-suficiente');
  await user.type(screen.getByLabelText(/nome da assessoria/i), 'Corrida na Serra');
}

function respostaOk() {
  return {
    ok: true,
    status: 201,
    json: async () => ({
      slug: 'corrida-na-serra',
      email: 'maria@exemplo.com',
      proximoPasso: 'Enviamos um e-mail de verificação.',
    }),
  } as Response;
}

function respostaErro(status: number) {
  return { ok: false, status, json: async () => ({}) } as Response;
}

describe('CadastroPage', () => {
  let fetchSpy: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    login.mockReset();
    fetchSpy = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('não exibe checkbox de aceite — o consentimento versionado vem depois do login', () => {
    renderizar();

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    // Mas os links informativos precisam estar lá.
    // Href na forma de hash: é o que o navegador precisa para o link funcionar de verdade.
    expect(screen.getByRole('link', { name: /termos de uso/i })).toHaveAttribute('href', '#/termos');
    expect(screen.getByRole('link', { name: /política de privacidade/i }))
      .toHaveAttribute('href', '#/privacidade');
  });

  it('sugere o identificador a partir do nome da assessoria, sem acento nem espaço', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText(/nome da assessoria/i), 'Assessoria Ação & Ritmo');

    expect(screen.getByLabelText(/identificador/i)).toHaveValue('assessoria-acao-ritmo');
  });

  it('para de sugerir depois que o usuário edita o identificador', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText(/nome da assessoria/i), 'Corrida');
    await user.clear(screen.getByLabelText(/identificador/i));
    await user.type(screen.getByLabelText(/identificador/i), 'meu-slug');
    await user.type(screen.getByLabelText(/nome da assessoria/i), ' na Serra');

    expect(screen.getByLabelText(/identificador/i)).toHaveValue('meu-slug');
  });

  it('bloqueia o envio com senha curta', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText(/seu nome/i), 'Maria');
    await user.type(screen.getByLabelText(/seu e-mail/i), 'maria@exemplo.com');
    await user.type(screen.getByLabelText(/^senha/i), 'curta');
    await user.type(screen.getByLabelText(/nome da assessoria/i), 'Corrida');

    expect(screen.getByRole('button', { name: /criar assessoria/i })).toBeDisabled();
    expect(screen.getByText(/ao menos 12 caracteres/i)).toBeInTheDocument();
  });

  it('bloqueia o envio com identificador de formato inválido', async () => {
    const user = userEvent.setup();
    renderizar();

    await preencher(user);
    await user.clear(screen.getByLabelText(/identificador/i));
    await user.type(screen.getByLabelText(/identificador/i), 'Corrida Serra');

    expect(screen.getByRole('button', { name: /criar assessoria/i })).toBeDisabled();
  });

  it('envia o cadastro e mostra a confirmação de verificação de e-mail', async () => {
    const user = userEvent.setup();
    fetchSpy.mockResolvedValue(respostaOk());
    renderizar();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));

    expect(await screen.findByText(/assessoria criada/i)).toBeInTheDocument();
    expect(screen.getByText(/enviamos um e-mail de verificação/i)).toBeInTheDocument();
  });

  it('NÃO inicia o login sozinho — só por ação do usuário', async () => {
    const user = userEvent.setup();
    fetchSpy.mockResolvedValue(respostaOk());
    renderizar();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));
    await screen.findByText(/assessoria criada/i);

    // O e-mail acabou de sair; redirecionar sozinho levaria a uma tela que ele não resolve ainda.
    expect(login).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /ir para o login/i }));
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('envia o header Idempotency-Key', async () => {
    const user = userEvent.setup();
    fetchSpy.mockResolvedValue(respostaOk());
    renderizar();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));
    await screen.findByText(/assessoria criada/i);

    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBeTruthy();
  });

  it('o retry após falha REUSA a mesma chave — chave nova por requisição criaria duas assessorias', async () => {
    const user = userEvent.setup();
    fetchSpy.mockRejectedValueOnce(new TypeError('network'));
    renderizar();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));
    await screen.findByRole('alert');

    fetchSpy.mockResolvedValue(respostaOk());
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));
    await screen.findByText(/assessoria criada/i);

    const primeira = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    const segunda = (fetchSpy.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(segunda['Idempotency-Key']).toBe(primeira['Idempotency-Key']);
  });

  it('editar o formulário após erro descarta a chave — a intenção mudou', async () => {
    const user = userEvent.setup();
    fetchSpy.mockRejectedValueOnce(new TypeError('network'));
    renderizar();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));
    await screen.findByRole('alert');

    await user.type(screen.getByLabelText(/seu nome/i), ' Silva');
    fetchSpy.mockResolvedValue(respostaOk());
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));
    await screen.findByText(/assessoria criada/i);

    const primeira = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    const segunda = (fetchSpy.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(segunda['Idempotency-Key']).not.toBe(primeira['Idempotency-Key']);
  });

  it.each([
    [409, /já está em uso/i],
    [429, /aguarde alguns minutos/i],
    [502, /tente novamente em alguns instantes/i],
  ])('mostra mensagem específica para %i', async (status, mensagem) => {
    const user = userEvent.setup();
    fetchSpy.mockResolvedValue(respostaErro(status));
    renderizar();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
  });

  it('mostra mensagem de conexão quando o fetch rejeita', async () => {
    const user = userEvent.setup();
    fetchSpy.mockRejectedValue(new TypeError('network'));
    renderizar();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/falha de conexão/i);
  });

  it('não grava nada no localStorage — nem token, nem credencial', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    fetchSpy.mockResolvedValue(respostaOk());
    renderizar();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));
    await screen.findByText(/assessoria criada/i);

    expect(setItem).not.toHaveBeenCalled();
  });

  it('desabilita o botão durante o envio, evitando o duplo clique', async () => {
    const user = userEvent.setup();
    let liberar: (r: Response) => void = () => {};
    fetchSpy.mockReturnValue(new Promise<Response>((resolve) => { liberar = resolve; }));
    renderizar();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /criar assessoria/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /criando/i })).toBeDisabled());
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    liberar(respostaOk());
    await screen.findByText(/assessoria criada/i);
  });
});
