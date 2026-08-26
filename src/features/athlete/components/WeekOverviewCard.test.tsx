import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeekOverviewCard } from './WeekOverviewCard';
import type { WeekOverview } from '../adapters/buildWeekOverview';

const base: WeekOverview = {
  temPlano: true,
  dias: [
    { date: new Date(2026, 7, 24), iso: '2026-08-24', status: 'concluido', color: '#8694A8' },
    { date: new Date(2026, 7, 25), iso: '2026-08-25', status: 'pulado', color: '#E364A6' },
    { date: new Date(2026, 7, 26), iso: '2026-08-26', status: 'hoje', color: '#8694A8' },
    { date: new Date(2026, 7, 27), iso: '2026-08-27', status: 'descanso', color: null },
    { date: new Date(2026, 7, 28), iso: '2026-08-28', status: 'futuro', color: '#F2845C' },
    { date: new Date(2026, 7, 29), iso: '2026-08-29', status: 'futuro', color: '#2BB6A3' },
    { date: new Date(2026, 7, 30), iso: '2026-08-30', status: 'descanso', color: null },
  ],
  volumeRealizadoKm: 14.5, volumePlanejadoKm: 42, streak: 3,
  proximaProva: { nomeProva: 'Meia de Floripa', diasFaltando: 39 },
};

describe('WeekOverviewCard', () => {
  it('mostra volume com uma casa, streak (região única) e a próxima prova', () => {
    render(<WeekOverviewCard overview={base} />);
    expect(screen.getByText('14,5')).toBeInTheDocument();
    expect(screen.getByText('/ 42 km')).toBeInTheDocument();
    expect(screen.getByTestId('home-streak')).toHaveTextContent(/3 semanas/);
    expect(screen.getByText(/meia de floripa/i)).toBeInTheDocument();
    expect(screen.getByText(/39 dias/)).toBeInTheDocument();
    expect(screen.getAllByTestId('home-week-day')).toHaveLength(7);
  });

  it('sem prova: CTA honesto; sem streak: não mostra "0 semanas"', () => {
    render(<WeekOverviewCard overview={{ ...base, streak: 0, proximaProva: null }} />);
    expect(screen.getByText(/peça ao seu coach para cadastrar sua próxima prova/i)).toBeInTheDocument();
    expect(screen.queryByText(/0 semanas/)).toBeNull();
    expect(screen.getByTestId('home-streak')).toHaveTextContent(/sem sequência ainda/i);
  });

  it('sem plano: barra sem meta e aviso de plano pendente', () => {
    render(<WeekOverviewCard overview={{ ...base, temPlano: false, volumePlanejadoKm: null, volumeRealizadoKm: 7.8 }} />);
    expect(screen.getByText('7,8')).toBeInTheDocument();
    expect(screen.queryByText(/\/ .* km/)).toBeNull();
    expect(screen.getByText(/sem plano aprovado/i)).toBeInTheDocument();
  });

  it('prova desconhecida (carregando/erro): não sugere "sem meta"', () => {
    render(<WeekOverviewCard overview={{ ...base, proximaProva: null }} provaConhecida={false} />);
    expect(screen.queryByText(/peça ao seu coach/i)).toBeNull();
    expect(screen.getByText(/próxima prova indisponível/i)).toBeInTheDocument();
  });

  it('prova sem diasFaltando: "Sua próxima meta"', () => {
    render(<WeekOverviewCard overview={{ ...base, proximaProva: { nomeProva: 'Maratona' } }} />);
    expect(screen.getByText(/sua próxima meta: maratona/i)).toBeInTheDocument();
  });
});
