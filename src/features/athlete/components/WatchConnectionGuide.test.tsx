import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WatchConnectionGuide } from './WatchConnectionGuide';

describe('WatchConnectionGuide', () => {
  it('Apple: rótulo "Compatível via app parceiro", nomeia os apps e nunca diz "suportado"', () => {
    render(<WatchConnectionGuide marcaAtual="APPLE" conectado={false} />);

    // Escopo na seção da Apple: a entrada do Garmin, no acordeão, legitimamente diz "Suportado".
    const secaoApple = screen.getByText('Compatível via app parceiro').parentElement!;
    expect(screen.getByRole('link', { name: 'Intervals.icu Companion' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Watchletic' })).toBeInTheDocument();
    expect(screen.getByText(/não envia treino direto ao Apple Watch/i)).toBeInTheDocument();
    expect(secaoApple.textContent).not.toMatch(/suportado/i);
  });

  it('Garmin: rótulo "Suportado" e passo de Upload planned workouts', () => {
    render(<WatchConnectionGuide marcaAtual="GARMIN" conectado />);

    expect(screen.getByText('Suportado')).toBeInTheDocument();
    expect(screen.getByText(/Upload planned workouts/)).toBeInTheDocument();
  });

  it('só a marca do atleta fica à vista; as outras ficam sob "Outro relógio?"', async () => {
    render(<WatchConnectionGuide marcaAtual="APPLE" conectado={false} />);

    expect(screen.getByText('Outro relógio?')).toBeInTheDocument();
    expect(screen.queryByText(/Marque a opção "Upload planned workouts"/)).not.toBeVisible();

    await userEvent.click(screen.getByText('Outro relógio?'));
    await userEvent.click(screen.getByText('Garmin'));
    expect(screen.getByText(/Marque a opção "Upload planned workouts"/)).toBeVisible();
  });

  it('sem marca: dica para informar o relógio e nenhum guia aberto', () => {
    render(<WatchConnectionGuide conectado={false} />);

    expect(screen.getByText(/Informe seu relógio no onboarding/)).toBeInTheDocument();
    expect(screen.queryByText('Compatível via app parceiro')).not.toBeVisible();
  });

  it('marca sem entrada na matriz cai em "Ainda não coberto", sem promessa', () => {
    render(<WatchConnectionGuide marcaAtual="POLAR" conectado={false} />);

    expect(screen.getByText('Ainda não coberto')).toBeInTheDocument();
    expect(screen.getByText(/procure a marca do seu relógio/)).toBeInTheDocument();
  });

  it('frase de contexto muda com a conexão', () => {
    const { rerender } = render(<WatchConnectionGuide marcaAtual="APPLE" conectado={false} />);
    expect(screen.getByText(/Antes de conectar/)).toBeInTheDocument();

    rerender(<WatchConnectionGuide marcaAtual="APPLE" conectado />);
    expect(screen.getByText(/Conectado\. Confira/)).toBeInTheDocument();
  });

  it('modo leitura esconde a frase de ação do atleta', () => {
    render(<WatchConnectionGuide marcaAtual="APPLE" conectado={false} modoLeitura />);

    expect(screen.queryByText(/Antes de conectar/)).not.toBeInTheDocument();
    expect(screen.getByText('Compatível via app parceiro')).toBeInTheDocument();
  });
});
