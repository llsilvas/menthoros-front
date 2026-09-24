import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IosInstallHintBanner } from './IosInstallHintBanner';

/**
 * Hint de instalação para iOS (add-athlete-pwa-ux-hints, task 1.3) — só apresentação: recebe o
 * callback de dispensa e não sabe de plataforma nenhuma. A decisão vive em `useIosInstallHint`.
 */
describe('IosInstallHintBanner', () => {
  it('explica o gesto do iPhone e oferece "Entendi"', () => {
    render(<IosInstallHintBanner onDismiss={vi.fn()} />);

    expect(
      screen.getByText("No iPhone: toque em Compartilhar e depois em 'Adicionar à Tela de Início'"),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entendi' })).toBeInTheDocument();
  });

  it('"Entendi" chama onDismiss uma vez', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<IosInstallHintBanner onDismiss={onDismiss} />);

    await user.click(screen.getByRole('button', { name: 'Entendi' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
