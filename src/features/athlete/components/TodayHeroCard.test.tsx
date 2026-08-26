import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import { TodayHeroCard } from './TodayHeroCard';

function renderHero(props: Partial<React.ComponentProps<typeof TodayHeroCard>> = {}) {
  const onRegister = vi.fn();
  const router = createHashRouter([{ path: '/', element: <TodayHeroCard nextWorkout={{ title: 'Corrida Fácil', description: '45 min em Z2', color: '#8694A8' }} onRegister={onRegister} {...props} /> }]);
  render(<RouterProvider router={router} />);
  return { onRegister };
}

describe('TodayHeroCard', () => {
  it('mostra o treino de hoje e uma única ação primária: Registrar treino', async () => {
    const { onRegister } = renderHero();
    expect(screen.getByTestId('home-next-workout')).toHaveTextContent(/corrida fácil/i);
    expect(screen.getByText('45 min em Z2')).toBeInTheDocument();
    const botoes = screen.getAllByRole('button');
    expect(botoes).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /registrar treino/i }));
    expect(onRegister).toHaveBeenCalled();
  });

  it('link para o plano usa o router real (hash)', () => {
    renderHero();
    expect(screen.getByRole('link', { name: /ver plano da semana/i })).toHaveAttribute('href', '#/athlete/plan');
  });

  it('sem treino planejado: mostra Descanso e mantém o registro disponível', () => {
    renderHero({ nextWorkout: null });
    expect(screen.getByTestId('home-next-workout')).toHaveTextContent(/descanso/i);
    expect(screen.getByRole('button', { name: /registrar treino/i })).toBeInTheDocument();
  });

  it('não tem frase motivacional fixa nem "Iniciar treino"', () => {
    renderHero();
    expect(screen.queryByText(/consistência constrói/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /iniciar treino/i })).toBeNull();
  });
});
