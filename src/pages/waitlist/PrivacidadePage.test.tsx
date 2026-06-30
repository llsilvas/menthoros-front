import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import PrivacidadePage from './PrivacidadePage';

function renderPage() {
  return render(
    <MemoryRouter>
      <PrivacidadePage />
    </MemoryRouter>,
  );
}

describe('PrivacidadePage', () => {
  it('renderiza a política com as seções LGPD principais', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByText(/Base legal/)).toBeInTheDocument();
    expect(screen.getByText(/Os seus direitos/)).toBeInTheDocument();
    // base legal cita a LGPD
    expect(screen.getByText(/13\.709\/2018/)).toBeInTheDocument();
  });

  it('oferece contato e link de volta para a waitlist', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /contato@menthoros\.com/ })).toHaveAttribute(
      'href',
      'mailto:contato@menthoros.com',
    );
    expect(screen.getByRole('link', { name: /voltar à lista de espera/i })).toHaveAttribute('href', '/waitlist');
  });
});
