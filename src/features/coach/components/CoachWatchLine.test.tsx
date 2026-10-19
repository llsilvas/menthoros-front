import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CoachWatchLine } from './CoachWatchLine';

describe('CoachWatchLine', () => {
  it('Apple: marca, modelo, "não confirmado" e o resumo condicional em Alert', () => {
    render(<CoachWatchLine relogio={{ marca: 'APPLE', modelo: 'Watch Ultra 2' }} />);

    expect(screen.getByText(/Relógio: Apple Watch · Watch Ultra 2/)).toBeInTheDocument();
    expect(screen.getByText(/não confirmado/)).toBeInTheDocument();
    expect(screen.getByText('Compatível via app parceiro')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/só via app parceiro no iPhone do atleta/);
  });

  it('Garmin: texto condicional, sem afirmar entrega automática', () => {
    render(<CoachWatchLine relogio={{ marca: 'GARMIN' }} />);

    expect(screen.getByText(/chegam ao relógio se o atleta ligou/)).toBeInTheDocument();
    expect(screen.getByText(/não verificado automaticamente/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('"O que pedir ao atleta" abre o guia da marca em modo leitura', async () => {
    render(<CoachWatchLine relogio={{ marca: 'APPLE' }} />);

    await userEvent.click(screen.getByRole('button', { name: 'O que pedir ao atleta' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('O que pedir ao atleta — Apple Watch');
    expect(dialog).toHaveTextContent(/Instale no iPhone o app Intervals\.icu Companion/);
    expect(dialog).not.toHaveTextContent(/Antes de conectar/);
  });

  it('sem relógio: "Relógio não informado"', () => {
    render(<CoachWatchLine relogio={null} avisos={null} />);

    expect(screen.getByText('Relógio não informado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'O que pedir ao atleta' })).not.toBeInTheDocument();
  });

  it('consulta falhou (aviso "relogio"): "Relógio indisponível", não "não informado"', () => {
    render(<CoachWatchLine relogio={undefined} avisos={['relogio']} />);

    expect(screen.getByText('Relógio indisponível')).toBeInTheDocument();
    expect(screen.queryByText('Relógio não informado')).not.toBeInTheDocument();
  });

  it('marca desconhecida do backend: cai em "Ainda não coberto" com o nome cru', () => {
    render(<CoachWatchLine relogio={{ marca: 'HUAWEI' }} />);

    expect(screen.getByText(/Relógio: HUAWEI/)).toBeInTheDocument();
    expect(screen.getByText('Ainda não coberto')).toBeInTheDocument();
  });
});
