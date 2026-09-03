import { describe, expect, it } from 'vitest';
import { buildAthleteRaceList, buildAthleteRaceView, countUpcomingRaces, selectTargetRace, tipoProvaDerivado } from './raceAdapters';
import type { Prova } from '../../../types/Prova';

const HOJE = new Date(2026, 8, 2);

const alvo: Prova = {
  id: 'a', nomeProva: 'Maratona SP', dataProva: '2026-12-06', tipoProva: 'MARATONA', distancia: 'KM_42',
  provaAlvo: true, semanasPreparacao: 16, semanasFaltando: 13, preparacaoCurta: true, tempoObjetivo: '03:45:00',
};
const secundaria: Prova = {
  id: 'b', nomeProva: 'Trilha da Serra', dataProva: '2026-10-25', tipoProva: 'TRAIL',
  distancia: { value: 'OUTRA', label: 'Outra', short: 'Outra', order: 4 }, distanciaKm: 30, provaAlvo: false,
};
const realizada: Prova = {
  id: 'c', nomeProva: 'Meia do Rio', dataProva: '2026-06-14', tipoProva: 'MEIA', distancia: 'KM_21', foiRealizada: true,
};

describe('buildAthleteRaceView', () => {
  it('monta rótulos, terreno e usa os derivados do backend quando existem', () => {
    const v = buildAthleteRaceView(alvo, HOJE);
    expect(v.dataLabel).toBe('6 de dez de 2026');
    expect(v.distanciaLabel).toBe('42 km');
    expect(v.terreno).toBe('RUA');
    expect(v.semanasFaltando).toBe(13);
    expect(v.semanasMinimas).toBe(16);
    expect(v.preparacaoCurta).toBe(true);
    expect(v.alvo).toBe(true);
  });

  it('lê distância serializada como objeto e trail como terreno', () => {
    const v = buildAthleteRaceView(secundaria, HOJE);
    expect(v.distancia).toBe('CUSTOMIZADA');
    expect(v.distanciaLabel).toBe('30 km');
    expect(v.terreno).toBe('TRAIL');
    expect(v.semanasFaltando).toBe(7);
    expect(v.preparacaoCurta).toBe(false);
  });

  it('marca realizada', () => {
    expect(buildAthleteRaceView(realizada, HOJE).realizada).toBe(true);
  });
});

describe('buildAthleteRaceList', () => {
  it('alvo primeiro, depois por data', () => {
    expect(buildAthleteRaceList([realizada, secundaria, alvo], HOJE).map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('selectTargetRace / countUpcomingRaces', () => {
  it('encontra a alvo futura e conta as futuras', () => {
    expect(selectTargetRace([realizada, secundaria, alvo], HOJE)?.id).toBe('a');
    expect(countUpcomingRaces([realizada, secundaria, alvo], HOJE)).toBe(2);
  });

  it('sem alvo devolve null', () => {
    expect(selectTargetRace([secundaria], HOJE)).toBeNull();
  });
});

describe('tipoProvaDerivado', () => {
  it('21 → MEIA, 42 → MARATONA, senão pelo terreno', () => {
    expect(tipoProvaDerivado('KM_21', 'TRAIL')).toBe('MEIA');
    expect(tipoProvaDerivado('KM_42', 'RUA')).toBe('MARATONA');
    expect(tipoProvaDerivado('KM_10', 'TRAIL')).toBe('TRAIL');
    expect(tipoProvaDerivado('CUSTOMIZADA', 'RUA')).toBe('CORRIDA_RUA');
  });
});
