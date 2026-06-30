import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Nav } from './sections';

function renderNav() {
  return render(
    <MemoryRouter>
      <Nav />
    </MemoryRouter>,
  );
}

describe('Nav — drawer mobile', () => {
  it('abre o drawer ao clicar no hamburguer e fecha no X', async () => {
    const user = userEvent.setup();
    renderNav();

    // fechado: botão "Fechar menu" (só existe dentro do drawer) ausente
    expect(screen.queryByLabelText('Fechar menu')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Abrir menu'));
    expect(screen.getByLabelText('Fechar menu')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Fechar menu'));
    await waitFor(() => expect(screen.queryByLabelText('Fechar menu')).not.toBeInTheDocument());
  });

  it('clicar num link do drawer fecha o menu', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByLabelText('Abrir menu'));
    // o drawer tem o link de login "Entrar"; clicar fecha o menu
    const entrarLinks = screen.getAllByRole('link', { name: 'Entrar' });
    await user.click(entrarLinks[entrarLinks.length - 1]);
    await waitFor(() => expect(screen.queryByLabelText('Fechar menu')).not.toBeInTheDocument());
  });
});
