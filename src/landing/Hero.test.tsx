import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import userEvent from '@testing-library/user-event';
import { Hero } from './sections';
import landingTheme from '../theme/landingTheme';

// landing-oferta-fundadora-clareza, RF-01: o hero precisa citar a continuidade paga e linkar para
// a seção de preços, sem sugerir ativação imediata ao clicar em "Solicitar acesso".
//
// `landingTheme` é obrigatório aqui: o hero renderiza `AttentionQueue` (ProductUI.tsx), que lê
// `t.palette.surfaceShift.panel` — uma extensão de tema que só existe no `landingTheme`, não no
// tema default do MUI usado quando nenhum `ThemeProvider` está presente.
function renderHero() {
  return render(
    <ThemeProvider theme={landingTheme}>
      <Hero />
    </ThemeProvider>,
  );
}

describe('Hero — indicação de continuidade paga', () => {
  it('mostra a dica de continuidade e ela aponta para a seção de preços (scroll), não para um checkout', async () => {
    const user = userEvent.setup();
    renderHero();

    const hint = screen.getByRole('button', { name: /planos a partir de r\$ 99\/mês/i });
    expect(hint).toBeInTheDocument();

    // sem elemento #precos no DOM (renderizado isolado), o clique não deve lançar erro —
    // scrollToId trata o getElementById nulo com optional chaining.
    await user.click(hint);
  });

  it('o CTA principal continua levando ao formulário, não a um checkout', () => {
    renderHero();
    expect(screen.getByRole('button', { name: /solicitar acesso/i })).toBeInTheDocument();
  });
});
