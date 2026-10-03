import { describe, expect, it } from 'vitest';
import { buildAthleteRaceList, buildAthleteRaceView, countUpcomingRaces, selectRaceThisWeek, selectTargetRace, tipoProvaDerivado } from './raceAdapters';
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
  it('CA1 — ordem cronológica: futuras ascendente, passadas (histórico) depois, descendente', () => {
    // alvo (dez/26, futura), secundaria (out/26, futura, não-alvo), realizada (jun/26, passada)
    // Bug anterior: alvo sempre primeiro, deixando a realizada (passada) antes da secundaria (futura).
    expect(buildAthleteRaceList([realizada, secundaria, alvo], HOJE).map((r) => r.id))
      .toEqual(['b', 'a', 'c']);
  });

  it('CA2 — prova-alvo distante não pula pro topo quando há uma não-alvo mais próxima', () => {
    const resultado = buildAthleteRaceList([alvo, secundaria], HOJE);
    expect(resultado[0].id).toBe('b'); // secundaria (out/26) é mais próxima que a alvo (dez/26)
    expect(resultado[0].categoria).toBe('proxima');
    expect(resultado[1].id).toBe('a');
    expect(resultado[1].categoria).toBe('alvo');
  });

  it('CA3 — próxima prova (não-alvo) recebe a categoria "proxima"', () => {
    const resultado = buildAthleteRaceList([alvo, secundaria], HOJE);
    const proxima = resultado.find((r) => r.id === 'b');
    expect(proxima?.categoria).toBe('proxima');
  });

  it('CA4 — alvo sendo a mais próxima: sem acúmulo, ninguém mais recebe "proxima"', () => {
    const alvoProxima: Prova = { ...secundaria, id: 'f', provaAlvo: true };
    const resultado = buildAthleteRaceList([alvoProxima, alvo], HOJE);
    expect(resultado[0].id).toBe('f');
    expect(resultado[0].categoria).toBe('alvo');
    expect(resultado[1].categoria).toBe('alvo'); // a mais distante também é alvo, continua "alvo"
    expect(resultado.some((r) => r.categoria === 'proxima')).toBe(false);
  });

  it('CA5 — prova passada recebe a categoria "historico"', () => {
    const resultado = buildAthleteRaceList([realizada], HOJE);
    expect(resultado[0].categoria).toBe('historico');
  });

  it('CA6 — sem prova-alvo, a mais próxima recebe "proxima" normalmente', () => {
    const resultado = buildAthleteRaceList([secundaria], HOJE);
    expect(resultado[0].categoria).toBe('proxima');
  });

  it('demais provas futuras (não a mais próxima, não alvo) recebem "futura"', () => {
    const terceira: Prova = { ...secundaria, id: 'g', dataProva: '2026-11-01' };
    const resultado = buildAthleteRaceList([secundaria, terceira], HOJE);
    expect(resultado.map((r) => r.id)).toEqual(['b', 'g']);
    expect(resultado[0].categoria).toBe('proxima');
    expect(resultado[1].categoria).toBe('futura');
  });

  it('múltiplas passadas ficam em histórico, mais recente primeiro', () => {
    const maisAntiga: Prova = { ...realizada, id: 'h', dataProva: '2026-01-10' };
    const resultado = buildAthleteRaceList([maisAntiga, realizada], HOJE);
    expect(resultado.map((r) => r.id)).toEqual(['c', 'h']);
    expect(resultado.every((r) => r.categoria === 'historico')).toBe(true);
  });

  it('regressão (Codex review, 2026-10-01) — prova-alvo já realizada vai pro histórico, não pro destaque', () => {
    // Resultado lançado antes da data oficial: dataProva ainda é futura, mas foiRealizada=true.
    // Sem a guarda, cairia em "futuras" e ganharia a categoria "alvo" (banner + chip "Realizada"
    // ao mesmo tempo — estado contraditório que o código anterior, `alvo && !realizada`, evitava).
    const alvoJaRealizada: Prova = { ...alvo, foiRealizada: true };
    const resultado = buildAthleteRaceList([alvoJaRealizada, secundaria], HOJE);

    expect(resultado[0].id).toBe('b'); // secundaria passa a ser a única futura, logo "proxima"
    expect(resultado[0].categoria).toBe('proxima');
    expect(resultado[1].id).toBe('a');
    expect(resultado[1].categoria).toBe('historico');
  });

  it('lista vazia não quebra', () => {
    expect(buildAthleteRaceList([], HOJE)).toEqual([]);
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

describe('selectRaceThisWeek (prova-no-plano-semanal, D7)', () => {
  // HOJE é quarta 02/09/2026; semana corrente: segunda 31/08 → domingo 06/09.
  const naSemana: Prova = { id: 'd', nomeProva: '10K de Domingo', dataProva: '2026-09-06', tipoProva: 'CORRIDA_RUA', distancia: 'KM_10' };

  it('encontra prova cuja data cai na semana corrente, com dia e dias faltando', () => {
    const v = selectRaceThisWeek([alvo, naSemana], HOJE);
    expect(v?.id).toBe('d');
    expect(v?.diaSemanaLabel).toBe('domingo');
    expect(v?.diasFaltando).toBe(4);
  });

  it('fora da semana corrente, devolve null', () => {
    expect(selectRaceThisWeek([alvo, secundaria], HOJE)).toBeNull();
  });

  it('prova cancelada na semana não conta', () => {
    expect(selectRaceThisWeek([{ ...naSemana, statusProva: 'CANCELADA' }], HOJE)).toBeNull();
  });

  it('prova já realizada na semana não conta', () => {
    expect(selectRaceThisWeek([{ ...naSemana, foiRealizada: true }], HOJE)).toBeNull();
  });

  it('duas provas futuras na semana: escolhe a mais próxima (quinta antes de domingo)', () => {
    const quintaFeira: Prova = { ...naSemana, id: 'e', nomeProva: 'Prova de Quinta', dataProva: '2026-09-03' };
    expect(selectRaceThisWeek([naSemana, quintaFeira], HOJE)?.id).toBe('e');
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
