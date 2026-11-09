import { describe, expect, it } from 'vitest';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import { buildShareCardData, garminAttributionFor, siglaDe } from './buildShareCardData';

function realizado(over: Partial<TreinoRealizadoDto> = {}): TreinoRealizadoDto {
  return {
    id: 'r1',
    dataTreino: '2026-11-07', // sábado
    tipoTreino: 'INTERVALADO',
    duracaoMin: '50:38',
    distanciaKm: 10.4,
    fonteDados: { value: 'GARMIN', label: 'Garmin' },
    deviceName: 'Forerunner 265',
    status: { value: 'REALIZADO', label: 'Realizado' },
    fcMedia: 158,
    ...over,
  };
}

const planejado: TreinoPlanejado = {
  tipoTreino: 'INTERVALADO',
  descricao: '6 × 800 m',
  distanciaKm: 10,
  etapas: [
    { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 12 },
    { ordem: 2, tipoEtapa: 'ESFORCO', distanciaKm: 0.8, repeticoes: 6 },
    { ordem: 3, tipoEtapa: 'DESAQUECIMENTO', duracaoMin: 8 },
  ],
} as TreinoPlanejado;

const voltas = [
  { ordem: 1, duracao: '03:30', distanciaKm: 0.8 },
  { ordem: 2, paceMedia: '4:19', distanciaKm: 0.8 },
  { ordem: 3, paceMedia: '4:14', distanciaKm: 0.8 },
];

describe('garminAttributionFor', () => {
  it('treino Garmin com modelo → "GARMIN {MODELO}" (CA4)', () => {
    expect(garminAttributionFor([realizado()])).toEqual({ label: 'GARMIN FORERUNNER 265', derived: false });
  });

  it('treino Garmin sem modelo → "GARMIN" (CA4)', () => {
    expect(garminAttributionFor([realizado({ deviceName: null })])?.label).toBe('GARMIN');
  });

  it('treino manual → sem atribuição (CA4)', () => {
    expect(garminAttributionFor([realizado({ fonteDados: { value: 'MANUAL', label: 'Manual' } })])).toBeNull();
  });

  it('fonteDados como string também é reconhecido', () => {
    const t = realizado({ fonteDados: 'GARMIN' as unknown as TreinoRealizadoDto['fonteDados'] });
    expect(garminAttributionFor([t])).not.toBeNull();
  });

  it('agregado com um Garmin entre manuais → derivado (CA5); só manuais → null', () => {
    const manual = realizado({ id: 'm', fonteDados: { value: 'MANUAL', label: 'Manual' } });
    expect(garminAttributionFor([manual, realizado(), manual], true)).toEqual({ label: 'GARMIN', derived: true });
    expect(garminAttributionFor([manual, manual], true)).toBeNull();
  });
});

describe('siglaDe', () => {
  it('ignora "Assessoria" e preposições', () => {
    expect(siglaDe('Assessoria Pace Forte')).toBe('PF');
    expect(siglaDe('Equipe de Corrida')).toBe('EC');
  });

  it('uma palavra só → uma letra', () => {
    expect(siglaDe('Correria')).toBe('C');
  });
});

describe('buildShareCardData', () => {
  it('treino do plano com voltas → os três modelos', () => {
    const d = buildShareCardData({
      realizado: realizado({ etapasRealizadas: voltas }),
      planejado,
      recentes: [],
      assessoriaNome: 'Assessoria Pace Forte',
    });

    expect(d.availableModels).toEqual(['plano', 'parciais', 'semana']);
    expect(d.signature).toEqual({ sigla: 'PF', nome: 'Assessoria Pace Forte' });
    // 1 aquecimento + 6 repetições + 1 desaquecimento.
    expect(d.plano?.blocos).toHaveLength(8);
    expect(d.plano?.titulo).toBe('6 × 800 m');
    expect(d.plano?.duracao).toBe('50:38');
    expect(d.plano?.paceMedio).toBe('4:52');
  });

  it('avulso sem planejado e sem voltas → só Semana (CA2)', () => {
    const d = buildShareCardData({ realizado: realizado(), planejado: null, recentes: [], assessoriaNome: null });

    expect(d.availableModels).toEqual(['semana']);
    expect(d.plano).toBeNull();
    expect(d.parciais).toBeNull();
    expect(d.signature).toBeNull();
  });

  it('parciais: pace por volta (paceMedia ou duração/distância) e melhor volta marcada', () => {
    const d = buildShareCardData({
      realizado: realizado({ etapasRealizadas: voltas }),
      planejado: null,
      recentes: [],
      assessoriaNome: null,
    });

    // 1ª volta derivada: 3:30 em 0,8 km = 262,5 s/km → 4:23.
    expect(d.parciais?.splits.map((s) => s.pace)).toEqual(['4:23', '4:19', '4:14']);
    expect(d.parciais?.splits.filter((s) => s.isBest).map((s) => s.n)).toEqual([3]);
  });

  it('uma volta só não gera Parciais', () => {
    const d = buildShareCardData({
      realizado: realizado({ etapasRealizadas: [voltas[0]] }),
      planejado: null,
      recentes: [],
      assessoriaNome: null,
    });
    expect(d.availableModels).not.toContain('parciais');
  });

  it('semana: recorta seg–dom do treino, soma km e tempo, conta treinos', () => {
    const recentes = [
      realizado({ id: 'a', dataTreino: '2026-11-03', distanciaKm: 8.2, duracaoMin: '45:00', fonteDados: { value: 'MANUAL', label: 'Manual' } }),
      realizado({ id: 'b', dataTreino: '2026-11-09', distanciaKm: 12, duracaoMin: '1:05:00' }), // outra semana
      realizado({ id: 'r1' }),
    ];

    const s = buildShareCardData({ realizado: realizado(), planejado: null, recentes, assessoriaNome: null }).semana;

    expect(s.dias.map((d) => d.km)).toEqual([0, 8.2, 0, 0, 0, 10.4, 0]);
    expect(s.totalKm).toBe(18.6);
    expect(s.treinos).toBe(2);
    expect(s.tempoTotal).toBe('1h36');
    expect(s.dias[0].color).toBeNull();
    expect(s.attribution).toEqual({ label: 'GARMIN', derived: true });
  });

  it('semana inclui o treino aberto mesmo fora da lista recente', () => {
    const s = buildShareCardData({ realizado: realizado(), planejado: null, recentes: [], assessoriaNome: null }).semana;
    expect(s.treinos).toBe(1);
    expect(s.totalKm).toBe(10.4);
  });
});

describe('buildShareCardData — esteira (athlete-share-cards-esteira)', () => {
  const base = { planejado: null, recentes: [], assessoriaNome: null };

  it('esteira: true → modelo Esteira antes de Semana, com km, pace, FC e TSS (CA1)', () => {
    const d = buildShareCardData({ ...base, realizado: realizado({ esteira: true, tipoTreino: 'CONTINUO', duracaoMin: '50:30', distanciaKm: 10, fcMedia: 146, tssCalculado: 58 }) });
    expect(d.availableModels).toEqual(['stickers', 'esteira', 'semana']);
    expect(d.esteira).toMatchObject({ titulo: 'Corrida Fácil', distanciaKm: 10, duracao: '50:30', paceMedio: '5:03', fcMedia: 146, tss: 58 });
    expect(d.esteira?.attribution?.label).toBe('GARMIN FORERUNNER 265');
  });

  it('esteira false ou ausente → sem modelo Esteira (CA1)', () => {
    expect(buildShareCardData({ ...base, realizado: realizado({ esteira: false }) }).esteira).toBeNull();
    expect(buildShareCardData({ ...base, realizado: realizado() }).availableModels).not.toContain('esteira');
  });

  it('sem distância, TSS ou FC → campos ausentes e pace ausente (CA2)', () => {
    const d = buildShareCardData({ ...base, realizado: realizado({ esteira: true, distanciaKm: undefined, fcMedia: undefined }) });
    expect(d.esteira).toMatchObject({ duracao: '50:38' });
    expect(d.esteira?.distanciaKm).toBeUndefined();
    expect(d.esteira?.paceMedio).toBeUndefined();
    expect(d.esteira?.fcMedia).toBeUndefined();
    expect(d.esteira?.tss).toBeUndefined();
  });
});
