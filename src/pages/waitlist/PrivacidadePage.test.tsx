import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createHashRouter, RouterProvider } from 'react-router';
import PrivacidadePage from './PrivacidadePage';
import { POLITICA_ATUALIZADA_EM, POLITICA_VERSAO } from './politicaPrivacidadeConteudo';

function renderPage() {
  const router = createHashRouter([{ path: '/', element: <PrivacidadePage /> }]);
  return render(<RouterProvider router={router} />);
}

describe('PrivacidadePage', () => {
  it('renderiza a política da plataforma com as seções LGPD principais', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByText(/1\. Quem trata os seus dados/)).toBeInTheDocument();
    expect(screen.getByText(/4\. Bases legais aplicáveis/)).toBeInTheDocument();
    expect(screen.getByText(/9\. Direitos do titular dos dados/)).toBeInTheDocument();
    // Citada na introdução e de novo na seção 14 (legislação aplicável).
    expect(screen.getAllByText(/13\.709\/2018/).length).toBeGreaterThan(0);
  });

  it('renderiza as tabelas normativas com cabeçalho acessível', () => {
    renderPage();
    expect(screen.getByRole('table', { name: /bases legais por finalidade/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /subprocessadores/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /direitos do titular/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /prazos de retenção/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Base legal' })).toBeInTheDocument();
  });

  it('descreve o uso de IA e o efeito de recusar o consentimento', () => {
    renderPage();
    expect(screen.getByText(/coach-in-the-loop/)).toBeInTheDocument();
    expect(screen.getByText(/os planos de treino são gerados manualmente pelo treinador/)).toBeInTheDocument();
  });

  it('oferece contato do DPO e link de volta para a página principal', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /contato@menthoros\.com/ })).toHaveAttribute(
      'href',
      'mailto:contato@menthoros.com',
    );
    expect(screen.getByRole('link', { name: /voltar à página principal/i })).toHaveAttribute('href', '#/');
  });

  it('exibe a mesma data que a versão carimbada no consentimento', () => {
    // Guard-rail do bump: `POLITICA_VERSAO` precisa bater com `app.lgpd.policy-version` no backend.
    // Se a data por extenso e a técnica divergirem, o coach aceita uma versão que não leu.
    renderPage();
    expect(POLITICA_VERSAO).toBe('2026-08-03');
    expect(POLITICA_ATUALIZADA_EM).toBe('3 de agosto de 2026');
    expect(screen.getByText(`Última atualização: ${POLITICA_ATUALIZADA_EM}`)).toBeInTheDocument();
  });
});
