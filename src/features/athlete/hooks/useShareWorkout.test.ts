import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useShareWorkout } from './useShareWorkout';
import { ManualTrainingService } from '../../../api/services/ManualTrainingService';
import { PlanoSemanalService } from '../../../api/services/PlanoSemanalService';
import { UsuarioService } from '../../../api/services/UsuarioService';
import { ApiError } from '../../../api/core/ApiError';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import type { UsuarioMeOutputDto } from '../../../types/Usuario';

vi.mock('../../../api/services/ManualTrainingService');
vi.mock('../../../api/services/PlanoSemanalService');
vi.mock('../../../api/services/UsuarioService');

const ME = {
  id: 'u1', nome: 'Marina', email: 'm@x', role: 'ATLETA', atletaId: 'a1', lgpdConsentGranted: true,
  assessoria: { id: 's1', nome: 'Assessoria Pace Forte' },
} as UsuarioMeOutputDto;

const REALIZADO: TreinoRealizadoDto = {
  id: 'r1',
  dataTreino: '2026-11-07',
  tipoTreino: 'INTERVALADO',
  duracaoMin: '50:38',
  distanciaKm: 10.4,
  fonteDados: { value: 'GARMIN', label: 'Garmin' },
  status: { value: 'REALIZADO', label: 'Realizado' },
  etapasRealizadas: [{ ordem: 1, paceMedia: '4:20' }, { ordem: 2, paceMedia: '4:15' }],
};

const PLANO = {
  treinosPlanejados: [{
    tipoTreino: 'INTERVALADO', treinoRealizadoId: 'r1',
    etapas: [{ ordem: 1, tipoEtapa: 'ESFORCO', distanciaKm: 0.8, repeticoes: 2 }],
  }],
} as unknown as PlanoSemanal;

async function carregar(id: string | undefined) {
  const { result } = renderHook(() => useShareWorkout(id));
  await act(async () => {
    await result.current.fetchData();
  });
  return result;
}

describe('useShareWorkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UsuarioService.getMe).mockResolvedValue(ME);
  });

  it('monta os cards com planejado vinculado e assessoria', async () => {
    vi.mocked(ManualTrainingService.listarRecentes).mockResolvedValue([REALIZADO]);
    vi.mocked(PlanoSemanalService.listarPlanosPorAtleta).mockResolvedValue([PLANO]);

    const r = await carregar('r1');

    expect(ManualTrainingService.listarRecentes).toHaveBeenCalledWith(30);
    expect(r.current.data?.availableModels).toEqual(['plano', 'parciais', 'semana']);
    expect(r.current.data?.signature?.sigla).toBe('PF');
    expect(r.current.loading).toBe(false);
    expect(r.current.error).toBeNull();
  });

  it('endpoint de planos devolvendo objeto único (não array) também acha o planejado', async () => {
    vi.mocked(ManualTrainingService.listarRecentes).mockResolvedValue([REALIZADO]);
    vi.mocked(PlanoSemanalService.listarPlanosPorAtleta).mockResolvedValue(PLANO as unknown as PlanoSemanal[]);

    const r = await carregar('r1');

    expect(r.current.error).toBeNull();
    expect(r.current.data?.availableModels).toEqual(['plano', 'parciais', 'semana']);
  });

  it('sem plano aprovado (404) segue sem planejado, não é erro', async () => {
    vi.mocked(ManualTrainingService.listarRecentes).mockResolvedValue([REALIZADO]);
    vi.mocked(PlanoSemanalService.listarPlanosPorAtleta).mockRejectedValue(
      new ApiError({ method: 'GET', url: '' }, { url: '', ok: false, status: 404, statusText: 'Not Found', body: null }, 'x'),
    );

    const r = await carregar('r1');

    expect(r.current.data?.availableModels).toEqual(['parciais', 'semana']);
    expect(r.current.error).toBeNull();
  });

  it('treino fora da lista recente → notFound (CA8)', async () => {
    vi.mocked(ManualTrainingService.listarRecentes).mockResolvedValue([REALIZADO]);

    const r = await carregar('outro');

    expect(r.current.notFound).toBe(true);
    expect(r.current.data).toBeNull();
    expect(PlanoSemanalService.listarPlanosPorAtleta).not.toHaveBeenCalled();
  });

  it('sem treinoId → notFound sem chamar a API', async () => {
    const r = await carregar(undefined);

    expect(r.current.notFound).toBe(true);
    expect(ManualTrainingService.listarRecentes).not.toHaveBeenCalled();
  });

  it('falha na lista → error (CA8)', async () => {
    vi.mocked(ManualTrainingService.listarRecentes).mockRejectedValue(new Error('rede'));

    const r = await carregar('r1');

    expect(r.current.error?.message).toBe('rede');
    expect(r.current.loading).toBe(false);
  });
});
