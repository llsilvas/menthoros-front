import { describe, expect, it } from 'vitest';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import {
  buildZonePreviewFromZones,
  formatPace,
  parsePace,
  validarAncoraFc,
  validarAncoraPace,
} from './zoneAnchors';

const HOJE = '2026-11-03';
const fc = (o: Partial<Parameters<typeof validarAncoraFc>[0]> = {}) => ({
  limiar: 168,
  maxima: null,
  maximaGravada: null,
  dataTeste: '2026-10-12',
  ...o,
});

describe('parsePace / formatPace', () => {
  it.each([
    ['4:50', 290],
    ['2:30', 150],
    ['12:00', 720],
    ['4:05', 245],
  ])('parse "%s" -> %i', (txt, seg) => {
    expect(parsePace(txt)).toBe(seg);
  });

  it.each(['', '4', '4:5', '4:60', '4:50:1', 'abc', '-4:50', '4,50'])('rejeita "%s"', (txt) => {
    expect(parsePace(txt)).toBeNull();
  });

  it('ida e volta exata para 150..720', () => {
    for (let s = 150; s <= 720; s++) expect(parsePace(formatPace(s))).toBe(s);
  });
});

describe('validarAncoraFc', () => {
  it('válido sem máxima', () => {
    expect(validarAncoraFc(fc(), HOJE)).toEqual({});
  });

  it.each([null, 99, 201])('limiar %s inválido', (limiar) => {
    expect(validarAncoraFc(fc({ limiar }), HOJE).limiar).toBeDefined();
  });

  it.each([100, 200])('limiar %i nos limites é aceito', (limiar) => {
    expect(validarAncoraFc(fc({ limiar, maxima: 220 }), HOJE).limiar).toBeUndefined();
  });

  it.each([119, 221])('máxima %i fora de 120–220', (maxima) => {
    expect(validarAncoraFc(fc({ maxima }), HOJE).maxima).toBeDefined();
  });

  it('máxima 169 com limiar 168 rejeitada (piso 178); 178 aceita', () => {
    expect(validarAncoraFc(fc({ maxima: 169 }), HOJE).maxima).toContain('178');
    expect(validarAncoraFc(fc({ maxima: 178 }), HOJE).maxima).toBeUndefined();
  });

  it('máxima vazia usa a gravada para o cruzamento', () => {
    expect(validarAncoraFc(fc({ maximaGravada: 170 }), HOJE).maxima).toBeDefined();
    expect(validarAncoraFc(fc({ maximaGravada: 186 }), HOJE).maxima).toBeUndefined();
  });

  it('sem máxima real (estimada) nunca bloqueia: limiar 185 aceito', () => {
    expect(validarAncoraFc(fc({ limiar: 185 }), HOJE)).toEqual({});
  });

  it('data: ausente, anterior a 2000, futura; hoje aceita', () => {
    expect(validarAncoraFc(fc({ dataTeste: '' }), HOJE).dataTeste).toBeDefined();
    expect(validarAncoraFc(fc({ dataTeste: '1999-12-31' }), HOJE).dataTeste).toBeDefined();
    expect(validarAncoraFc(fc({ dataTeste: '2026-11-04' }), HOJE).dataTeste).toBeDefined();
    expect(validarAncoraFc(fc({ dataTeste: HOJE }), HOJE).dataTeste).toBeUndefined();
    expect(validarAncoraFc(fc({ dataTeste: '2000-01-01' }), HOJE).dataTeste).toBeUndefined();
  });
});

describe('validarAncoraPace', () => {
  const p = (limiarSegKm: number | null, dataTeste = '2026-10-12') => ({ limiarSegKm, dataTeste });

  it('válido', () => {
    expect(validarAncoraPace(p(290), HOJE)).toEqual({});
  });

  it.each([null, 149, 721])('ritmo %s inválido', (v) => {
    expect(validarAncoraPace(p(v), HOJE).limiarSegKm).toBeDefined();
  });

  it.each([150, 720])('ritmo %i nos limites aceito', (v) => {
    expect(validarAncoraPace(p(v), HOJE).limiarSegKm).toBeUndefined();
  });

  it('data futura rejeitada', () => {
    expect(validarAncoraPace(p(290, '2026-12-01'), HOJE).dataTeste).toBeDefined();
  });
});

describe('buildZonePreviewFromZones', () => {
  const zonas: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { fcLimiar: 168, fcLimiarEstimada: false, paceLimiarMinKm: 290 / 60 },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 186, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [
      { numero: 1, nome: 'Recuperação', fc: { min: 126, max: 143 }, pace: { minSegKm: 374, maxSegKm: 421 } },
      { numero: 2, nome: 'Base', fc: { min: 143, max: 150 }, pace: { minSegKm: 331, maxSegKm: 371 } },
      { numero: 6, nome: 'Sprint', fc: null, motivoFc: 'FC_NAO_ESTABILIZA', pace: { minSegKm: 232, maxSegKm: 261 } },
    ],
  };

  it('FC: referência em % do limiar, De/Até em bpm e Z6 marcada sem FC', () => {
    const { linhas, barra } = buildZonePreviewFromZones(zonas, 'fc');
    expect(linhas[0]).toMatchObject({ numero: 1, referencia: '75–85% LTHR', de: '126', ate: '143', semFc: false });
    expect(linhas[2]).toMatchObject({ numero: 6, referencia: '—', semFc: true });
    // Z6 fica fora da barra de FC; largura proporcional à faixa
    expect(barra).toEqual([
      { numero: 1, peso: 17 },
      { numero: 2, peso: 7 },
    ]);
  });

  it('ritmo: referência em % do limiar, De/Até em m:ss e todas as zonas na barra', () => {
    const { linhas, barra } = buildZonePreviewFromZones(zonas, 'pace');
    expect(linhas[0]).toMatchObject({ referencia: '129–145% limiar', de: '6:14', ate: '7:01', semFc: false });
    expect(barra.map((b) => b.numero)).toEqual([1, 2, 6]);
    expect(barra[0].peso).toBe(47);
  });

  it('sem pace de limiar: referência vazia e faixa ausente vira traço', () => {
    const semPace = {
      ...zonas,
      ancoras: { ...zonas.ancoras, paceLimiarMinKm: null },
      zonas: [{ numero: 1 as const, nome: 'Recuperação', fc: { min: 126, max: 143 }, pace: null }],
    };
    const { linhas, barra } = buildZonePreviewFromZones(semPace, 'pace');
    expect(linhas[0]).toMatchObject({ referencia: '—', de: '—', ate: '—' });
    expect(barra).toEqual([]);
  });
});
