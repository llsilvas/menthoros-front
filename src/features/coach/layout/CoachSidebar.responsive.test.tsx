import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoachSidebar from './CoachSidebar';
import { simularLarguraDaTela } from '../../../test/matchMedia';

vi.mock('../../../hooks/useLogoAssessoria', () => ({
  useLogoAssessoria: () => null,
}));

vi.mock('../../../shared/components/LogoutButton', () => ({
  LogoutButton: () => <button type="button">sair</button>,
}));

const LS_KEY = 'coach-sidebar-collapsed';

function montar() {
  render(
    <CoachSidebar
      activeRoute="/coach/inbox"
      coach={{ id: 'c1', name: 'Coach Teste' }}
      currentTenant={{ id: 't1', name: 'Corridas Serra', athleteCount: 4 }}
      onNavigate={vi.fn()}
    />,
  );
}

const botaoExpandir = () => screen.queryByRole('button', { name: /expandir sidebar/i });
const botaoRecolher = () => screen.queryByRole('button', { name: /recolher sidebar/i });

/**
 * Viewport compacto = largura abaixo de `lg` (1200px): notebook de 13" ou Full HD com escala de
 * 125%+. Antes a sidebar abria sempre em 240px, que é 20% da largura útil dessa tela.
 */
describe('CoachSidebar — recolhimento por viewport', () => {
  it('em tela larga, abre expandida quando não há preferência salva', () => {
    simularLarguraDaTela(1440);

    montar();

    expect(botaoRecolher()).toBeInTheDocument();
    expect(screen.getByText('Atletas')).toBeInTheDocument();
  });

  it('em tela larga, respeita a preferência salva de recolhida', () => {
    simularLarguraDaTela(1440);
    localStorage.setItem(LS_KEY, 'true');

    montar();

    expect(botaoExpandir()).toBeInTheDocument();
  });

  it('em viewport compacto, nasce recolhida mesmo sem preferência', () => {
    simularLarguraDaTela(1100);

    montar();

    expect(botaoExpandir()).toBeInTheDocument();
    // Rótulos escondidos — só ícones.
    expect(screen.queryByText('Atletas')).not.toBeInTheDocument();
  });

  /**
   * O recolhimento automático é do viewport, não do coach: gravar `true` aqui faria a sidebar
   * aparecer recolhida depois, no monitor grande, sem que ele tenha pedido.
   */
  it('o recolhimento automático não grava a preferência', () => {
    simularLarguraDaTela(1100);

    montar();

    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it('no compacto, expandir à mão funciona e continua sem gravar preferência', async () => {
    simularLarguraDaTela(1100);
    const user = userEvent.setup();
    montar();

    await user.click(botaoExpandir()!);

    expect(screen.getByText('Atletas')).toBeInTheDocument();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it('em tela larga, recolher à mão grava a preferência', async () => {
    simularLarguraDaTela(1440);
    const user = userEvent.setup();
    montar();

    await user.click(botaoRecolher()!);

    expect(botaoExpandir()).toBeInTheDocument();
    expect(localStorage.getItem(LS_KEY)).toBe('true');
  });

  it('a tecla [ alterna sem gravar preferência no compacto', async () => {
    simularLarguraDaTela(1100);
    const user = userEvent.setup();
    montar();

    // `[` é delimitador na sintaxe do user-event; `[[` envia o caractere literal.
    await user.keyboard('[[');

    expect(botaoRecolher()).toBeInTheDocument();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });
});
