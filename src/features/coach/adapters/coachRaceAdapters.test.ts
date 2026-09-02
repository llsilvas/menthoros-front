import { describe, expect, it } from 'vitest';
import { buildCoachRaceList, buildCoachRaceView, pendingChipLabel } from './coachRaceAdapters';
import type { Prova } from '../../../types/Prova';

const HOJE = new Date(2026, 8, 2);

const alvoPendente: Prova = {
  id: 'a', nomeProva: 'Maratona SP', dataProva: '2026-12-06', tipoProva: 'MARATONA', distancia: 'KM_42', provaAlvo: true,
  semanasPreparacao: 16, semanasFaltando: 13, preparacaoCurta: true, revisadaPeloCoach: false, motivoRevisao: 'ALVO_TROCADA', alvoAnteriorNome: 'Meia do Rio',
};
const revisada: Prova = {
  id: 'b', nomeProva: 'Trilha', dataProva: '2026-10-25', tipoProva: 'TRAIL', distancia: 'KM_10', provaAlvo: false, revisadaPeloCoach: true,
};
const canceladaPendente: Prova = {
  id: 'c', nomeProva: 'Corrida do Parque', dataProva: '2026-09-20', tipoProva: 'CORRIDA_RUA', distancia: 'KM_5', statusProva: 'CANCELADA',
  revisadaPeloCoach: false, motivoRevisao: 'CANCELADA',
};
const passada: Prova = { id: 'd', nomeProva: 'Antiga', dataProva: '2026-01-01', tipoProva: 'MEIA', distancia: 'KM_21', revisadaPeloCoach: true };

describe('buildCoachRaceView', () => {
  it('monta chip de pendência com o nome da alvo anterior', () => {
    const v = buildCoachRaceView(alvoPendente, HOJE);
    expect(v.pendente).toEqual({ motivo: 'ALVO_TROCADA', label: 'Alvo trocada (antes Meia do Rio)' });
    expect(v.preparacaoCurta).toBe(true);
    expect(v.semanasFaltando).toBe(13);
    expect(v.alvo).toBe(true);
  });

  it('revisada não tem pendência', () => {
    expect(buildCoachRaceView(revisada, HOJE).pendente).toBeNull();
  });
});

describe('buildCoachRaceList', () => {
  it('une futuras com canceladas pendentes, exclui passadas, pendentes primeiro', () => {
    const lista = buildCoachRaceList([revisada, passada, { ...alvoPendente, revisadaPeloCoach: true, motivoRevisao: undefined }], [alvoPendente, canceladaPendente], HOJE);
    expect(lista.map((r) => r.id)).toEqual(['a', 'c', 'b']);
    expect(lista[0].pendente?.motivo).toBe('ALVO_TROCADA');
    expect(lista[1].cancelada).toBe(true);
    expect(lista[1].pendente?.label).toBe('Cancelada pelo atleta');
  });
});

describe('pendingChipLabel', () => {
  it('rotula cada motivo', () => {
    expect(pendingChipLabel('NOVA')).toBe('Nova');
    expect(pendingChipLabel('DATA_ALTERADA')).toBe('Data alterada');
    expect(pendingChipLabel('ALVO_TROCADA')).toBe('Alvo trocada');
    expect(pendingChipLabel(undefined)).toBe('Alterada');
  });
});
