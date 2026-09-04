import { describe, expect, it } from 'vitest';
import { buildTodayWorkoutProfile, formatAlvoEtapa } from './buildTodayWorkoutProfile';
import type { EtapaAlvo } from '../../../types/AthleteWorkoutToday';

describe('buildTodayWorkoutProfile', () => {
  it('sem etapas: undefined, sem placeholder', () => {
    expect(buildTodayWorkoutProfile(undefined, { zonaAlvo: null })).toBeUndefined();
    expect(buildTodayWorkoutProfile([], { zonaAlvo: null })).toBeUndefined();
  });

  it('gera um bloco por etapa com duração', () => {
    const etapas: EtapaAlvo[] = [
      { ordem: 1, tipoEtapa: 'AQUECIMENTO', descricao: 'Trote', duracaoMin: 10, alvoPrimario: 'NENHUM' },
      { ordem: 2, tipoEtapa: 'INTERVALADO', descricao: 'Tiro', duracaoMin: 4, alvoPrimario: 'FC', fcAlvoMin: 145, fcAlvoMax: 151 },
    ];

    const profile = buildTodayWorkoutProfile(etapas, { zonaAlvo: 'Z4' });

    expect(profile?.blocks).toHaveLength(2);
  });

  it('preserva bloco/repetição para o suporte de série', () => {
    const bloco = 'b1';
    const etapas: EtapaAlvo[] = [
      { ordem: 1, duracaoMin: 3, blocoId: bloco, blocoRepeticoes: 2, alvoPrimario: 'NENHUM' },
      { ordem: 2, duracaoMin: 2, blocoId: bloco, blocoRepeticoes: 2, alvoPrimario: 'NENHUM' },
      { ordem: 3, duracaoMin: 3, blocoId: bloco, blocoRepeticoes: 2, alvoPrimario: 'NENHUM' },
      { ordem: 4, duracaoMin: 2, blocoId: bloco, blocoRepeticoes: 2, alvoPrimario: 'NENHUM' },
    ];

    const profile = buildTodayWorkoutProfile(etapas, { zonaAlvo: null });

    expect(profile?.blocks[0].repeat).toEqual({ groupId: bloco, index: 1, total: 2 });
  });
});

describe('formatAlvoEtapa', () => {
  it('FC: faixa em bpm', () => {
    expect(formatAlvoEtapa({ alvoPrimario: 'FC', fcAlvoMin: 145, fcAlvoMax: 151 })).toBe('145–151 bpm');
  });

  it('PACE: o valor já formatado pelo backend', () => {
    expect(formatAlvoEtapa({ alvoPrimario: 'PACE', paceAlvo: '4:30-4:45' })).toBe('4:30-4:45 /km');
  });

  it('NENHUM: null — a tela mostra a zona, sem inventar alvo', () => {
    expect(formatAlvoEtapa({ alvoPrimario: 'NENHUM' })).toBeNull();
  });
});
