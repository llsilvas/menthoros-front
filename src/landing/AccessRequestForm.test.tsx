import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AccessRequestForm } from './AccessRequestForm';
import type { WaitlistStatus } from '../hooks/useWaitlist';

let mockStatus: WaitlistStatus = 'idle';
let mockError: string | null = null;
const inscreverMock = vi.fn();

vi.mock('../hooks/useWaitlist', () => ({
  useWaitlist: () => ({ status: mockStatus, error: mockError, inscrever: inscreverMock }),
}));

function renderForm(props: Parameters<typeof AccessRequestForm>[0] = {}) {
  return render(
    <MemoryRouter>
      <AccessRequestForm {...props} />
    </MemoryRouter>,
  );
}

async function selecionarPerfil(user: ReturnType<typeof userEvent.setup>, nome: RegExp) {
  // "Você é" é um <select> nativo (como no protótipo): seleção por opção, não clique em menu.
  await user.selectOptions(screen.getByRole('combobox', { name: 'Você é' }), screen.getByRole('option', { name: nome }));
}

describe('AccessRequestForm', () => {
  beforeEach(() => {
    mockStatus = 'idle';
    mockError = null;
    inscreverMock.mockReset();
    sessionStorage.clear();
  });

  it('botão nasce habilitado — validação vira erro no submit, não desabilita o botão', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /solicitar acesso/i })).toBeEnabled();
  });

  it('não envia sem selecionar "Você é" nem aceitar a LGPD, e mostra os erros', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'maria@exemplo.com');
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(inscreverMock).not.toHaveBeenCalled();
    expect(screen.getByText('Selecione uma opção.')).toBeInTheDocument();
    expect(screen.getByText('É preciso aceitar para continuar.')).toBeInTheDocument();
  });

  it('mostra "Número de atletas" só para treinador, nunca para atleta', async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.queryByRole('spinbutton', { name: 'Número de atletas' })).not.toBeInTheDocument();

    await selecionarPerfil(user, /treinador/i);
    expect(screen.getByRole('spinbutton', { name: 'Número de atletas' })).toBeInTheDocument();

    await selecionarPerfil(user, /^atleta$/i);
    expect(screen.queryByRole('spinbutton', { name: 'Número de atletas' })).not.toBeInTheDocument();
  });

  it('envia o payload completo de um treinador, com telefone e faixa mapeada', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'maria@exemplo.com');
    await user.type(screen.getByRole('textbox', { name: /whatsapp/i }), '11999999999');
    await selecionarPerfil(user, /treinador/i);
    await user.type(screen.getByRole('spinbutton', { name: 'Número de atletas' }), '15');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(inscreverMock).toHaveBeenCalledTimes(1);
    expect(inscreverMock).toHaveBeenCalledWith({
      nome: 'Maria',
      email: 'maria@exemplo.com',
      telefone: '11999999999',
      perfil: 'TREINADOR',
      qtdAtletas: 'DE_11_A_30',
      aceiteLgpd: true,
      website: undefined,
    });
  });

  it('envia o payload de um atleta sem telefone e sem número de atletas', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'João');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'joao@exemplo.com');
    await selecionarPerfil(user, /^atleta$/i);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(inscreverMock).toHaveBeenCalledWith({
      nome: 'João',
      email: 'joao@exemplo.com',
      telefone: undefined,
      perfil: 'ATLETA',
      qtdAtletas: undefined,
      aceiteLgpd: true,
      website: undefined,
    });
  });

  it('inclui os parâmetros UTM da URL no payload (window.location.search)', async () => {
    window.history.pushState({}, '', '/?utm_source=instagram&utm_campaign=turma-fundadora');
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'maria@exemplo.com');
    await selecionarPerfil(user, /^atleta$/i);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(inscreverMock).toHaveBeenCalledWith(
      expect.objectContaining({ utmSource: 'instagram', utmCampaign: 'turma-fundadora' }),
    );

    window.history.pushState({}, '', '/');
  });

  it('não inclui campos UTM no payload quando a URL não tem nenhum', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'maria@exemplo.com');
    await selecionarPerfil(user, /^atleta$/i);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    const payload = inscreverMock.mock.calls[0][0];
    expect(payload).not.toHaveProperty('utmSource');
    expect(payload).not.toHaveProperty('utmMedium');
    expect(payload).not.toHaveProperty('utmCampaign');
    expect(payload).not.toHaveProperty('utmContent');
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

  it('exibe a confirmação de treinador quando o status é success', () => {
    mockStatus = 'success';
    renderForm();
    expect(screen.getByText(/você está na fila/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copiar link/i })).not.toBeInTheDocument();
  });

  it('exibe a confirmação de atleta, com CTA de compartilhar, quando enviou como atleta', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'João');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'joao@exemplo.com');
    await selecionarPerfil(user, /^atleta$/i);
    await user.click(screen.getByRole('checkbox'));

    mockStatus = 'success';
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(await screen.findByText(/avisa seu treinador/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copiar link/i })).toBeInTheDocument();
  });

  it('em modo compact (página já mostra oferta e Garmin acima) não repete o aviso nem o rodapé', () => {
    renderForm({ compact: true });
    expect(screen.queryByText(/hoje o menthoros lê dados do/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/continuidade mediante contratação/i)).not.toBeInTheDocument();
  });

  it('mostra o aviso de Garmin perto do envio por padrão', () => {
    renderForm();
    expect(screen.getByText(/hoje o menthoros lê dados do/i)).toBeInTheDocument();
  });

  it('renderiza o honeypot oculto', () => {
    renderForm();
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).toBeTruthy();
    expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  });

  it('renderiza o header só enquanto o status não é success', () => {
    const { rerender } = renderForm({ header: <div>Cabeçalho do card</div> });
    expect(screen.getByText('Cabeçalho do card')).toBeInTheDocument();

    mockStatus = 'success';
    rerender(
      <MemoryRouter>
        <AccessRequestForm header={<div>Cabeçalho do card</div>} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Cabeçalho do card')).not.toBeInTheDocument();
  });
});
