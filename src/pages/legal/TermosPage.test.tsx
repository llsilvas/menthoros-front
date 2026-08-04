import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createHashRouter, RouterProvider } from 'react-router';
import TermosPage from './TermosPage';
import { TERMOS_ATUALIZADOS_EM, TERMOS_VERSAO } from './termosDeUsoConteudo';

function renderPage() {
  const router = createHashRouter([{ path: '/', element: <TermosPage /> }]);
  return render(<RouterProvider router={router} />);
}

describe('TermosPage', () => {
  it('renderiza os Termos de Uso com as seções principais', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Termos de Uso' })).toBeInTheDocument();
    expect(screen.getByText(/1\. Definições/)).toBeInTheDocument();
    expect(screen.getByText(/4\. Uso aceitável/)).toBeInTheDocument();
    expect(screen.getByText(/10\. Limitação de responsabilidade/)).toBeInTheDocument();
  });

  it('deixa explícito que a plataforma não substitui avaliação médica', () => {
    // Cláusula central do produto: a IA propõe, o treinador prescreve. Se este texto sumir num bump,
    // a plataforma passa a parecer prescritora de treino sem ressalva de saúde.
    renderPage();
    expect(screen.getByText(/não presta serviço médico/)).toBeInTheDocument();
    expect(screen.getByText(/responsabilidade pela prescrição de treino/)).toBeInTheDocument();
  });

  it('exibe a mesma data que a versão carimbada no consentimento', () => {
    // Guard-rail do bump: `TERMOS_VERSAO` precisa bater com `app.lgpd.terms-version` no backend.
    // Se a data por extenso e a técnica divergirem, o coach aceita uma versão que não leu.
    renderPage();
    expect(TERMOS_VERSAO).toBe('2026-08-03');
    expect(TERMOS_ATUALIZADOS_EM).toBe('3 de agosto de 2026');
    expect(screen.getByText(`Última atualização: ${TERMOS_ATUALIZADOS_EM}`)).toBeInTheDocument();
  });

  it('oferece contato do DPO e link de volta para a página principal', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /contato@menthoros\.com/ })).toHaveAttribute(
      'href',
      'mailto:contato@menthoros.com',
    );
    expect(screen.getByRole('link', { name: /voltar à página principal/i })).toHaveAttribute(
      'href',
      '#/',
    );
  });
});
