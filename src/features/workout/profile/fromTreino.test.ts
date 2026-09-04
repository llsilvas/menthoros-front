import { describe, expect, it } from 'vitest';
import { buildProfileFromTreino } from './fromTreino';
import type { EtapaTreino } from '../../../types/TreinoPlanejado';

const bloco = (ordem: number, tipo: string, dur: number): EtapaTreino => ({ ordem, tipoEtapa: tipo, duracaoMin: dur, blocoId: 'b1', blocoRepeticoes: 2 });

describe('buildProfileFromTreino', () => {
  it('sem etapas → undefined (sem placeholder)', () => {
    expect(buildProfileFromTreino(undefined, {})).toBeUndefined();
    expect(buildProfileFromTreino([], {})).toBeUndefined();
  });

  it('ordena por `ordem` antes de indexar: etapas fora de ordem ainda produzem a série 1,1,2,2', () => {
    const desordenadas: EtapaTreino[] = [bloco(4, 'ESFORCO', 4), bloco(2, 'ESFORCO', 4), { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10 }, bloco(5, 'RECUPERACAO', 2), bloco(3, 'RECUPERACAO', 2)];
    const profile = buildProfileFromTreino(desordenadas, { tssPlanejado: 70, zonaAlvo: 'Z4' })!;
    const repeats = profile.blocks.filter((b) => b.repeat);
    expect(repeats.map((b) => b.repeat!.index)).toEqual([1, 1, 2, 2]);
    expect(repeats.every((b) => b.repeat!.total === 2)).toBe(true);
    expect(profile.blocks[0].kind).toBe('warmup');
  });
});
