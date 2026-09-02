import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createHashRouter, RouterProvider } from 'react-router';
import { RaceTargetBanner, type RaceTargetBannerProps } from './RaceTargetBanner';
import type { Prova } from '../../../types/Prova';

const HOJE = new Date(2026, 8, 2);

function renderBanner(props: Partial<RaceTargetBannerProps> = {}) {
  const router = createHashRouter([{ path: '/', element: <RaceTargetBanner provas={[]} hoje={HOJE} {...props} /> }]);
  return render(<RouterProvider router={router} />);
}

const alvo: Prova = {
  id: 'a', nomeProva: 'Maratona SP', dataProva: '2026-12-06', tipoProva: 'MARATONA', distancia: 'KM_42',
  provaAlvo: true, semanasPreparacao: 16, semanasFaltando: 13, preparacaoCurta: true,
};
const semAlvo: Prova = { id: 'b', nomeProva: 'Trilha', dataProva: '2026-10-25', tipoProva: 'TRAIL', distancia: 'KM_10', provaAlvo: false };

describe('RaceTargetBanner', () => {
  it('com prova-alvo: nome, data, "faltam N de M semanas", chip de preparação curta e link para Minhas provas', () => {
    renderBanner({ provas: [alvo, semAlvo] });
    const banner = screen.getByTestId('race-target-banner');
    expect(banner).toHaveAttribute('data-state', 'alvo');
    expect(banner).toHaveTextContent('Maratona SP');
    expect(banner).toHaveTextContent('6 de dez de 2026');
    expect(banner).toHaveTextContent('faltam 13 semanas de 16');
    expect(screen.getByText('Preparação curta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /minhas provas/i })).toHaveAttribute('href', '#/athlete/races');
  });

  it('provas sem alvo: convida a escolher', () => {
    renderBanner({ provas: [semAlvo] });
    expect(screen.getByTestId('race-target-banner')).toHaveAttribute('data-state', 'sem-alvo');
    expect(screen.getByText(/nenhuma prova-alvo/i)).toBeInTheDocument();
    expect(screen.getByText(/1 prova cadastrada/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /escolher/i })).toHaveAttribute('href', '#/athlete/races');
  });

  it('nenhuma prova: CTA para cadastrar', () => {
    renderBanner({ provas: [] });
    expect(screen.getByTestId('race-target-banner')).toHaveAttribute('data-state', 'vazio');
    expect(screen.getByText(/nenhuma prova cadastrada/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cadastrar prova/i })).toHaveAttribute('href', '#/athlete/races/new');
  });

  it('carregando ou com erro não afirma nada', () => {
    renderBanner({ provas: [], loading: true });
    expect(screen.queryByTestId('race-target-banner')).toBeNull();
  });
});
