import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import LandingPage from './LandingPage';

beforeEach(() => {
  // Reveal usa IntersectionObserver (ausente no jsdom) — stub no-op.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage premium', () => {
  it('renderiza as seções premium (hero + CTA de acesso)', () => {
    renderLanding();
    expect(screen.getByText('decide.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /solicitar acesso/i }).length).toBeGreaterThan(0);
  });

  it('o CTA rola até o formulário (scrollIntoView), sem navegar de rota', async () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getAllByRole('button', { name: /solicitar acesso/i })[0]);
    expect(scrollSpy).toHaveBeenCalled();
  });
});
