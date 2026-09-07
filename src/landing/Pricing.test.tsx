import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pricing } from './sections';

// landing-oferta-fundadora-clareza, RF-02/RF-03: o cartão "Gratuito — R$ 0/mês" sugeria plano
// gratuito permanente; o bloco fundador vira o elemento principal, e a comparação de planos deixa
// de usar opacidade global para "esconder" os planos futuros.

describe('Pricing — oferta fundadora e comparação de planos', () => {
  it('não apresenta o plano Gratuito nem qualquer referência a "R$ 0"', () => {
    render(<Pricing />);
    expect(screen.queryByText(/gratuito/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$\s*0\b/)).not.toBeInTheDocument();
  });

  it('renderiza o bloco da oferta fundadora com os 5 elementos, na ordem', () => {
    render(<Pricing />);
    const elementos = [
      screen.getByText('Programa fundador · 10 vagas'),
      screen.getByText(/60 dias grátis, sem cartão/),
      screen.getByText('R$ 99/mês'),
      screen.getByText(/cadastrar um cartão e contratar o plano/),
      screen.getByRole('button', { name: /solicitar acesso/i }),
    ];
    // cada elemento aparece antes do próximo na ordem do documento
    for (let i = 0; i < elementos.length - 1; i++) {
      const atual = elementos[i];
      const proximo = elementos[i + 1];
      expect(atual.compareDocumentPosition(proximo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('não atribui ao teste os limites de capacidade do Basic (D-02 pendente)', () => {
    render(<Pricing />);
    // a frase do teste em si não deve citar "20 atletas" fora do contexto "após o teste"
    const afterTrial = screen.getByText(/Após o teste, continue no Basic/);
    expect(afterTrial.textContent).toMatch(/até 20 atletas/);
    const trialLine = screen.getByText(/Experimente o Menthoros por 60 dias grátis/);
    expect(trialLine.textContent).not.toMatch(/atletas/);
  });

  it('mostra o sub-título dos planos futuros e os 4 cards, sem selo de trial nem botão Assinar', () => {
    render(<Pricing />);
    expect(screen.getByText('Planos previstos para o lançamento geral')).toBeInTheDocument();
    expect(screen.queryByText(/trial/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /assinar/i })).not.toBeInTheDocument();

    for (const nome of ['BASIC', 'PRO', 'ENTERPRISE', 'SCALE']) {
      expect(screen.getByText(nome)).toBeInTheDocument();
    }
  });

  it('diferencia o Basic dos planos futuros só por texto (status), não por opacidade', () => {
    render(<Pricing />);
    expect(screen.getByText('Onde o teste termina')).toBeInTheDocument();
    expect(screen.getAllByText('Disponível no lançamento geral')).toHaveLength(3);
  });

  it('Scale não promete atletas ilimitados — só "100+"', () => {
    render(<Pricing />);
    expect(screen.getByText('100+')).toBeInTheDocument();
    expect(screen.queryByText(/atletas ilimitados/i)).not.toBeInTheDocument();
  });
});
