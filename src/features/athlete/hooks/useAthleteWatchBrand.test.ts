import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteWatchBrand } from './useAthleteWatchBrand';
import { OnboardingService } from '../../../api/services/OnboardingService';
import { resolverAtletaIdAtual } from '../../../hooks/resolverAtletaId';
import type { AthleteOnboardingProfile } from '../../../types/Onboarding';

vi.mock('../../../api/services/OnboardingService');
vi.mock('../../../hooks/resolverAtletaId');

const perfil = (extra: Partial<AthleteOnboardingProfile>) => extra as AthleteOnboardingProfile;

describe('useAthleteWatchBrand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolverAtletaIdAtual).mockResolvedValue('a1');
  });

  it('perfil com marca e modelo', async () => {
    vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(
      perfil({ dispositivoMarca: 'APPLE', dispositivoModelo: 'Watch Ultra 2' }),
    );

    const { result } = renderHook(() => useAthleteWatchBrand());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.marca).toBe('APPLE');
    expect(result.current.modelo).toBe('Watch Ultra 2');
    expect(result.current.error).toBeNull();
  });

  it('perfil sem marca: marca indefinida, sem erro', async () => {
    vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(perfil({}));

    const { result } = renderHook(() => useAthleteWatchBrand());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.marca).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('204 (sem perfil): marca indefinida, não erro', async () => {
    vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAthleteWatchBrand());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.marca).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('erro de rede vai para error, separado da ausência de marca', async () => {
    vi.mocked(OnboardingService.buscarRascunho).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useAthleteWatchBrand());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.marca).toBeUndefined();
  });

  it('com atletaId informado, não resolve o atleta do JWT', async () => {
    vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(perfil({ dispositivoMarca: 'GARMIN' }));

    const { result } = renderHook(() => useAthleteWatchBrand('outro'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(resolverAtletaIdAtual).not.toHaveBeenCalled();
    expect(OnboardingService.buscarRascunho).toHaveBeenCalledWith('outro');
  });

  it('troca de atleta de populado para vazio limpa a marca', async () => {
    vi.mocked(OnboardingService.buscarRascunho)
      .mockResolvedValueOnce(perfil({ dispositivoMarca: 'APPLE' }))
      .mockResolvedValueOnce(undefined);

    const { result, rerender } = renderHook(({ id }) => useAthleteWatchBrand(id), { initialProps: { id: 'a1' } });
    await waitFor(() => expect(result.current.marca).toBe('APPLE'));

    rerender({ id: 'a2' });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.marca).toBeUndefined();
  });
});
