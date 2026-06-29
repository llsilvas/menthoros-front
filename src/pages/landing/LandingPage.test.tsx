import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigateMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

import LandingPage from './LandingPage';

describe('LandingPage — CTAs', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('o CTA de conversão "Começar agora" navega para /waitlist', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(screen.getByRole('button', { name: /começar agora/i }));
    expect(navigateMock).toHaveBeenCalledWith('/waitlist');
  });

  it('o botão "Entrar" navega para /auth/login', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(screen.getAllByRole('button', { name: /^entrar$/i })[0]);
    expect(navigateMock).toHaveBeenCalledWith('/auth/login');
  });
});
