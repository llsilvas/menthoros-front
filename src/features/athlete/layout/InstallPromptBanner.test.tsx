import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallPromptBanner } from './InstallPromptBanner';

/**
 * Banner de instalação (add-athlete-pwa-installable, task 1.6) — só apresentação: recebe os dois
 * callbacks e não sabe de evento nenhum. A lógica vive em `useInstallPrompt`.
 */
describe('InstallPromptBanner', () => {
  it('oferece a instalação com o texto decidido no grill e as duas ações', () => {
    render(<InstallPromptBanner onInstall={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByText('Instalar o Menthoros na tela inicial')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Instalar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agora não' })).toBeInTheDocument();
  });

  it('"Instalar" chama onInstall e "Agora não" chama onDismiss', async () => {
    const user = userEvent.setup();
    const onInstall = vi.fn();
    const onDismiss = vi.fn();
    render(<InstallPromptBanner onInstall={onInstall} onDismiss={onDismiss} />);

    await user.click(screen.getByRole('button', { name: 'Instalar' }));
    await user.click(screen.getByRole('button', { name: 'Agora não' }));

    expect(onInstall).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
