import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WatchConnectionGuide } from './WatchConnectionGuide';

describe('WatchConnectionGuide', () => {
  it('Apple: rótulo "Compatível via app parceiro", nomeia os apps e nunca diz "suportado"', () => {
    render(<WatchConnectionGuide marcaAtual="APPLE" conectado={false} />);

    // A marca do atleta renderiza antes do acordeão, que repete o rótulo (Samsung) e diz "Suportado" (Garmin).
    const secaoApple = screen.getAllByText('Compatível via app parceiro')[0].parentElement!;
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
    screen.getAllByText('Compatível via app parceiro').forEach((chip) => expect(chip).not.toBeVisible());
  });

  it('marca não coberta fica em "Ainda não coberto", sem promessa', () => {
    render(<WatchConnectionGuide marcaAtual="SUUNTO" conectado={false} />);

    expect(screen.getAllByText('Ainda não coberto')[0]).toBeVisible();
    expect(screen.getAllByText(/procure a marca do seu relógio/)[0]).toBeVisible();
  });

  it('COROS em validação: avisa que a marca está sendo validada e linka a doc oficial', () => {
    render(<WatchConnectionGuide marcaAtual="COROS" conectado={false} />);

    expect(screen.getByText('Em validação')).toBeVisible();
    expect(screen.getByText(/Estamos validando com atletas; se o treino não chegar, avise seu treinador/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Documentação no intervals.icu' })).toHaveAttribute(
      'href',
      'https://forum.intervals.icu/t/coros-support-added/37006',
    );
  });

  it('Polar: "Só treino realizado" e o aviso de que o treino planejado não chega', () => {
    render(<WatchConnectionGuide marcaAtual="POLAR" conectado={false} />);

    expect(screen.getByText('Só treino realizado')).toBeVisible();
    expect(screen.getByText(/treino planejado não chega ao relógio/)).toBeVisible();
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
    expect(screen.getAllByText('Compatível via app parceiro')[0]).toBeInTheDocument();
  });
});
