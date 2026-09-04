import { describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import { TodayHeroCard } from './TodayHeroCard';
import { buildProfileFromTreino } from '../../workout/profile';

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

  it('treino de hoje: mostra "Ver etapas e começar" para o modo treino', () => {
    renderHero({ nextWorkout: { title: 'Corrida Fácil', description: '45 min em Z2', isToday: true } });
    expect(screen.getByRole('link', { name: /ver etapas e começar/i })).toHaveAttribute('href', '#/athlete/workout/today');
  });

  it('treino futuro (fora de hoje): sem "Ver etapas e começar"', () => {
    renderHero({ nextWorkout: { title: 'Longo', description: 'Z2', isToday: false } });
    expect(screen.queryByRole('link', { name: /ver etapas e começar/i })).toBeNull();
  });

  it('sem treino planejado: mostra Descanso e mantém o registro disponível', () => {
    renderHero({ nextWorkout: null });
    expect(screen.getByTestId('home-next-workout')).toHaveTextContent(/descanso/i);
    expect(screen.getByRole('button', { name: /registrar treino/i })).toBeInTheDocument();
  });

  it('com perfil: desenha o WorkoutProfile compacto com a série; sem perfil: nada (sem placeholder)', () => {
    const etapas = [
      { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10 },
      { ordem: 2, tipoEtapa: 'ESFORCO', duracaoMin: 4, blocoId: 'b1', blocoRepeticoes: 2 },
      { ordem: 3, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
      { ordem: 4, tipoEtapa: 'ESFORCO', duracaoMin: 4, blocoId: 'b1', blocoRepeticoes: 2 },
      { ordem: 5, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
    ];
    const profile = buildProfileFromTreino(etapas, {})!;
    renderHero({ nextWorkout: { title: 'Intervalado', description: '2x(4/2)', color: '#E364A6', estimatedDuration: 45, profile } });
    expect(screen.getByTestId('workout-profile')).toBeInTheDocument();
    expect(screen.getByTestId('repeat-bracket')).toHaveTextContent('2×');
    expect(screen.getByText(/45 min/)).toBeInTheDocument();
    cleanup();

    renderHero();
    expect(screen.queryByTestId('workout-profile')).toBeNull();
    expect(screen.queryByTestId('workout-profile-empty')).toBeNull();
  });

  it('não tem frase motivacional fixa nem "Iniciar treino"', () => {
    renderHero();
    expect(screen.queryByText(/consistência constrói/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /iniciar treino/i })).toBeNull();
  });
});
