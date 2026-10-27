import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

  describe('canal de conexão (conexaoCanal)', () => {
    const garmin = (extra: Record<string, unknown> = {}) => ({
      plataforma: { value: 'GARMIN', label: 'Garmin Connect' },
      ativo: true,
      workoutImport: true,
      activityExport: true,
      ...extra,
    });

    it('Garmin ativo: canal direto, conexão ativa e as permissões concedidas', () => {
      render(<CoachWatchLine relogio={{ marca: 'GARMIN' }} conexaoCanal={garmin({ activityExport: false })} />);

      const linha = screen.getByText(/^Canal:/);
      expect(linha).toHaveTextContent('Garmin (canal direto)');
      expect(linha).toHaveTextContent('conexão ativa');
      expect(linha).toHaveTextContent('envio de treinos: sim');
      expect(linha).toHaveTextContent('leitura de atividades: não');
    });

    it('revogada: mostra "conexão revogada" com o motivo, e não "sem canal conectado"', () => {
      render(
        <CoachWatchLine relogio={{ marca: 'GARMIN' }} conexaoCanal={garmin({ ativo: false, lastSyncError: 'Atleta removeu o acesso no Garmin' })} />,
      );

      const linha = screen.getByText(/^Canal:/);
      expect(linha).toHaveTextContent('conexão revogada (Atleta removeu o acesso no Garmin)');
      expect(linha).not.toHaveTextContent('sem canal conectado');
    });

    it('sem conexão: "sem canal conectado"', () => {
      render(<CoachWatchLine relogio={{ marca: 'COROS' }} conexaoCanal={null} />);

      expect(screen.getByText(/^Canal:/)).toHaveTextContent('sem canal conectado');
    });

    it('intervals.icu ativo aparece pelo nome do canal', () => {
      render(
        <CoachWatchLine
          relogio={{ marca: 'COROS' }}
          conexaoCanal={{ plataforma: { value: 'INTERVALS_ICU', label: 'intervals.icu' }, ativo: true, workoutImport: true, activityExport: true }}
        />,
      );

      expect(screen.getByText(/^Canal:/)).toHaveTextContent('intervals.icu · conexão ativa');
    });
  });

  describe('texto do guia segue o canal real (flag do front ligada)', () => {
    it('Garmin conectado pelo intervals.icu mostra a entrada via intervals.icu, não "canal direto"', async () => {
      vi.resetModules();
      vi.doMock('../../../config/env', () => ({ runtimeConfig: { garminHabilitado: true } }));
      const { CoachWatchLine: Linha } = await import('./CoachWatchLine');

      render(
        <Linha
          relogio={{ marca: 'GARMIN' }}
          conexaoCanal={{ plataforma: { value: 'INTERVALS_ICU', label: 'intervals.icu' }, ativo: true, workoutImport: true, activityExport: true }}
        />,
      );

      expect(screen.getByText(/vão ao intervals\.icu e chegam ao relógio/)).toBeInTheDocument();
      vi.doUnmock('../../../config/env');
    });
  });
});
