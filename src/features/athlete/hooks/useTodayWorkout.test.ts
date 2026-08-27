import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTodayWorkout } from './useTodayWorkout';
import { AthleteWorkoutTodayService } from '../../../api/services/AthleteWorkoutTodayService';
import type { TreinoHoje } from '../../../types/AthleteWorkoutToday';

vi.mock('../../../api/services/AthleteWorkoutTodayService');

const TREINO_STUB: TreinoHoje = {
  hoje: '2026-08-27',
  id: 't1',
  tipoTreino: 'INTERVALADO',
  statusTreino: 'PENDENTE',
  etapas: [{ ordem: 1, alvoPrimario: 'NENHUM' }],
};

describe('useTodayWorkout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('popula treino no sucesso', async () => {
    vi.mocked(AthleteWorkoutTodayService.getTreinoHoje).mockResolvedValue(TREINO_STUB);

    const { result } = renderHook(() => useTodayWorkout());
    await act(async () => {
      await result.current.fetchTreino();
    });

    expect(result.current.treino).toEqual(TREINO_STUB);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('sem treino hoje (204 → undefined): estado vazio, não erro', async () => {
    vi.mocked(AthleteWorkoutTodayService.getTreinoHoje).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayWorkout());
    await act(async () => {
      await result.current.fetchTreino();
    });

    expect(result.current.treino).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('popula error na falha da busca', async () => {
    vi.mocked(AthleteWorkoutTodayService.getTreinoHoje).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useTodayWorkout());
    await act(async () => {
      await result.current.fetchTreino();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.loading).toBe(false);
  });

  it('pular atualiza o treino com o resultado do pulo e devolve o resultado', async () => {
    vi.mocked(AthleteWorkoutTodayService.getTreinoHoje).mockResolvedValue(TREINO_STUB);
    const pulado: TreinoHoje = { ...TREINO_STUB, statusTreino: 'PERDIDO', motivoPulo: 'DOR' };
    vi.mocked(AthleteWorkoutTodayService.pularHoje).mockResolvedValue(pulado);

    const { result } = renderHook(() => useTodayWorkout());
    await act(async () => {
      await result.current.fetchTreino();
    });

    let devolvido: TreinoHoje | undefined;
    await act(async () => {
      devolvido = await result.current.pular('DOR');
    });

    expect(AthleteWorkoutTodayService.pularHoje).toHaveBeenCalledWith('DOR');
    expect(result.current.treino).toEqual(pulado);
    expect(devolvido).toEqual(pulado);
  });

  it('pular sem motivo chama o serviço sem argumento', async () => {
    vi.mocked(AthleteWorkoutTodayService.pularHoje).mockResolvedValue({ ...TREINO_STUB, statusTreino: 'PERDIDO' });

    const { result } = renderHook(() => useTodayWorkout());
    await act(async () => {
      await result.current.pular();
    });

    expect(AthleteWorkoutTodayService.pularHoje).toHaveBeenCalledWith(undefined);
  });

  it('pular propaga o erro em pularError sem sobrescrever o treino já carregado', async () => {
    vi.mocked(AthleteWorkoutTodayService.getTreinoHoje).mockResolvedValue(TREINO_STUB);
    vi.mocked(AthleteWorkoutTodayService.pularHoje).mockRejectedValue(new Error('regra de negócio'));

    const { result } = renderHook(() => useTodayWorkout());
    await act(async () => {
      await result.current.fetchTreino();
    });
    await act(async () => {
      await result.current.pular('DOR').catch(() => undefined);
    });

    expect(result.current.pularError).toBeInstanceOf(Error);
    expect(result.current.treino).toEqual(TREINO_STUB);
  });
});
