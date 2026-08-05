import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from './LogoutButton';
import { AuthContext, type AuthContextData } from '../../context/auth/authContext';

function renderBotao(overrides: Partial<AuthContextData> = {}, colapsado = false) {
  const ctx: AuthContextData = {
    isAuthenticated: true,
    carregando: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  render(
    <AuthContext.Provider value={ctx}>
      <LogoutButton colapsado={colapsado} />
    </AuthContext.Provider>,
  );

  return ctx;
}

describe('LogoutButton', () => {
  // O botão fica ao lado de itens de navegação; sair por engano custa o trabalho em andamento.
  it('não desloga no primeiro clique — pede confirmação', async () => {
    const user = userEvent.setup();
    const ctx = renderBotao();

    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(ctx.logout).not.toHaveBeenCalled();
    expect(screen.getByText('Sair da conta')).toBeInTheDocument();
  });

  it('desloga ao confirmar', async () => {
    const user = userEvent.setup();
    const ctx = renderBotao();

    await user.click(screen.getByRole('button', { name: 'Sair' }));
    // O rótulo "Sair" existe no gatilho e no botão do diálogo; pega o do diálogo.
    const dialogo = screen.getByRole('dialog');
    await user.click(within(dialogo).getByRole('button', { name: 'Sair' }));

    expect(ctx.logout).toHaveBeenCalledTimes(1);
  });

  it('cancelar fecha sem deslogar', async () => {
    const user = userEvent.setup();
    const ctx = renderBotao();

    await user.click(screen.getByRole('button', { name: 'Sair' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(ctx.logout).not.toHaveBeenCalled();
  });

  /**
   * Falha no logout **não** pode fechar o diálogo: fechar faria parecer que a saída ocorreu,
   * enquanto o usuário segue autenticado — falha silenciosa justamente onde ele quer certeza.
   */
  it('mantém o diálogo aberto e avisa quando o logout falha', async () => {
    const user = userEvent.setup();
    const ctx = renderBotao({ logout: vi.fn().mockRejectedValue(new Error('falhou')) });

    await user.click(screen.getByRole('button', { name: 'Sair' }));
    const dialogo = screen.getByRole('dialog');
    await user.click(within(dialogo).getByRole('button', { name: 'Sair' }));

    expect(ctx.logout).toHaveBeenCalled();
    expect(await screen.findByText(/não foi possível sair/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // Ícone sozinho precisa de nome acessível — a sidebar recolhida não mostra o rótulo.
  it('mantém nome acessível quando colapsado', () => {
    renderBotao({}, true);

    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });
});
