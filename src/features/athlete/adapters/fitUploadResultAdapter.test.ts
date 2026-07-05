import { describe, it, expect } from 'vitest';
import { buildFitUploadPreview } from './fitUploadResultAdapter';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';

function treino(overrides: Partial<TreinoRealizadoDto> = {}): TreinoRealizadoDto {
  return {
    id: 't1',
    dataTreino: '2026-07-01',
    tipoTreino: 'CONTINUO',
    duracaoMin: '00:30:00',
    distanciaKm: 5,
    fcMedia: 150,
    tssCalculado: 62,
    fonteDados: { value: 'MANUAL', label: 'Manual' },
    status: { value: 'REALIZADO', label: 'Realizado' },
    etapasRealizadas: [{}, {}],
    ...overrides,
  };
}

describe('buildFitUploadPreview', () => {
  it('monta o preview completo com duração, distância, FC e laps', () => {
    const preview = buildFitUploadPreview(treino());

    expect(preview.duracaoLabel).toBe('30 min');
    expect(preview.distanciaLabel).toBe('5.0 km');
    expect(preview.fcLabel).toBe('FC média 150 bpm');
    expect(preview.lapsLabel).toBe('2 laps');
  });

  it('usa singular quando há apenas 1 lap', () => {
    expect(buildFitUploadPreview(treino({ etapasRealizadas: [{}] })).lapsLabel).toBe('1 lap');
  });

  it('omite laps quando não há etapas (esteira sem laps, ou lista vazia)', () => {
    expect(buildFitUploadPreview(treino({ etapasRealizadas: [] })).lapsLabel).toBeNull();
    expect(buildFitUploadPreview(treino({ etapasRealizadas: undefined })).lapsLabel).toBeNull();
  });

  it('omite distância quando ausente (nunca fabrica 0)', () => {
    expect(buildFitUploadPreview(treino({ distanciaKm: undefined })).distanciaLabel).toBeNull();
    expect(buildFitUploadPreview(treino({ distanciaKm: 0 })).distanciaLabel).toBeNull();
  });

  it('omite FC quando ausente', () => {
    expect(buildFitUploadPreview(treino({ fcMedia: undefined })).fcLabel).toBeNull();
  });

  it('duração malformada não quebra — omite a linha', () => {
    expect(buildFitUploadPreview(treino({ duracaoMin: 'abc' })).duracaoLabel).toBeNull();
  });
});
