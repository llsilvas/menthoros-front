import { describe, it, expect } from 'vitest';
import { fromEtapaTreino, fromEtapaTreinoDto, fromEtapaItens, indexarRepeticoes } from './input';
import { selectWorkoutProfile } from './selectWorkoutProfile';
import type { EtapaTreino } from '../../../types/TreinoPlanejado';
import type { EtapaTreinoDto } from '../../../types/PlanoReview';
import type { EtapaItem } from '../../coach/components/etapas/etapaItem';

describe('fromEtapaTreino — detalhe do treino', () => {
  it('resolve `tipoEtapa` quando vem como objeto serializado do enum', () => {
    const etapa: EtapaTreino = {
      tipoEtapa: { value: 'AQUECIMENTO', label: 'Aquecimento' },
      duracaoMin: 10,
    };
    expect(fromEtapaTreino(etapa).tipo).toBe('AQUECIMENTO');
  });

  it('resolve `tipoEtapa` quando vem como string', () => {
    expect(fromEtapaTreino({ tipoEtapa: 'PRINCIPAL', duracaoMin: 20 }).tipo).toBe('PRINCIPAL');
  });

  // Sem bloco na origem, nada de bloco na saída — inferir grupo por igualdade de rótulo
  // seria adivinhação apresentada como estrutura.
  it('não inventa blocoId quando a etapa não vem de um bloco', () => {
    const entrada = fromEtapaTreino({ tipoEtapa: 'INTERVALADO', duracaoMin: 3, repeticoes: 5 });
    expect(entrada.blocoId).toBeUndefined();
    expect(entrada.blocoRepeticoes).toBeUndefined();
  });
});

describe('fromEtapaTreinoDto — treino salvo na revisão', () => {
  it('preserva blocoId e blocoRepeticoes, que só existem neste tipo', () => {
    const dto: EtapaTreinoDto = {
      tipoEtapa: 'INTERVALADO',
      duracaoMin: 3,
      blocoId: 'g1',
      blocoRepeticoes: 5,
      fcAlvoEtapa: 'Z4',
    };
    expect(fromEtapaTreinoDto(dto)).toMatchObject({
      tipo: 'INTERVALADO',
      duracaoMin: 3,
      blocoId: 'g1',
      blocoRepeticoes: 5,
      fcAlvo: 'Z4',
    });
  });
});

describe('fromEtapaItens — editor ao vivo', () => {
  const bloco5x2: EtapaItem[] = [
    {
      id: 'b-1',
      kind: 'block',
      repeticoes: '5',
      steps: [
        { id: 's-1', tipoEtapa: 'INTERVALADO',  duracaoMin: '3', distanciaKm: '', fcAlvoEtapa: 'Z4' },
        { id: 's-2', tipoEtapa: 'RECUPERACAO',  duracaoMin: '2', distanciaKm: '', fcAlvoEtapa: 'Z1' },
      ],
    },
  ];

  it('expande um bloco 5×2 em 10 entradas, com repeat.index de 1 a 5', () => {
    const entradas = fromEtapaItens(bloco5x2);
    expect(entradas).toHaveLength(10);

    const indices = entradas.map((e) => e.blocoRepeticaoIndex);
    expect(indices).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(entradas.every((e) => e.blocoRepeticoes === 5)).toBe(true);
    expect(new Set(entradas.map((e) => e.blocoId)).size).toBe(1);
  });

  // O activeBlockId sincroniza o bloco destacado com a linha em edição; um id que
  // muda a cada render faria o destaque piscar enquanto o treinador digita.
  it('gera ids estáveis entre duas chamadas com o mesmo estado', () => {
    expect(fromEtapaItens(bloco5x2).map((e) => e.id))
      .toEqual(fromEtapaItens(bloco5x2).map((e) => e.id));
  });

  it('não agrupa etapas avulsas — sem bloco, sem repeat', () => {
    const avulsas: EtapaItem[] = [
      { id: 'a-1', kind: 'step', tipoEtapa: 'AQUECIMENTO', duracaoMin: '10', distanciaKm: '', fcAlvoEtapa: 'Z2' },
      { id: 'a-2', kind: 'step', tipoEtapa: 'AQUECIMENTO', duracaoMin: '10', distanciaKm: '', fcAlvoEtapa: 'Z2' },
    ];
    const entradas = fromEtapaItens(avulsas);
    expect(entradas).toHaveLength(2);
    expect(entradas.every((e) => e.blocoId === undefined)).toBe(true);
  });

  // Um bloco de uma repetição não é uma série: emitir repeat aqui desenharia um
  // bracket "1×" sobre um bloco solto, afirmando estrutura que não existe.
  it('um bloco de uma repetição não vira série', () => {
    const umaVez: EtapaItem[] = [{
      id: 'b-2', kind: 'block', repeticoes: '1',
      steps: [{ id: 's-3', tipoEtapa: 'PRINCIPAL', duracaoMin: '20', distanciaKm: '', fcAlvoEtapa: 'Z3' }],
    }];
    const entradas = fromEtapaItens(umaVez);
    expect(entradas).toHaveLength(1);
    expect(entradas[0].blocoId).toBeUndefined();
  });

  it('mantém a ordem da lista entre itens', () => {
    const mistura: EtapaItem[] = [
      { id: 'a-1', kind: 'step', tipoEtapa: 'AQUECIMENTO', duracaoMin: '10', distanciaKm: '', fcAlvoEtapa: 'Z2' },
      ...bloco5x2,
      { id: 'a-2', kind: 'step', tipoEtapa: 'DESAQUECIMENTO', duracaoMin: '5', distanciaKm: '', fcAlvoEtapa: 'Z1' },
    ];
    const tipos = fromEtapaItens(mistura).map((e) => e.tipo);
    expect(tipos[0]).toBe('AQUECIMENTO');
    expect(tipos[tipos.length - 1]).toBe('DESAQUECIMENTO');
    expect(tipos).toHaveLength(12);
  });
});

describe('indexarRepeticoes — série já expandida pelo backend', () => {
  const etapa = (tipo: string, bloco?: { id: string; reps: number }, duracaoMin = 3): EtapaTreino => ({
    tipoEtapa: tipo, duracaoMin, blocoId: bloco?.id, blocoRepeticoes: bloco?.reps,
  });

  it('bloco 4× (esforço, recuperação) já vem como 8 linhas: índices 1,1,2,2,3,3,4,4 e total 4', () => {
    const linhas = Array.from({ length: 4 }, () => [etapa('ESFORCO', { id: 'b1', reps: 4 }), etapa('RECUPERACAO', { id: 'b1', reps: 4 })]).flat();
    const entradas = indexarRepeticoes(linhas.map(fromEtapaTreino));
    expect(entradas).toHaveLength(8); // nunca reexpande
    expect(entradas.map((e) => e.blocoRepeticaoIndex)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    const profile = selectWorkoutProfile(entradas, { sport: 'run' });
    const repeats = profile.blocks.filter((b) => b.repeat);
    expect(repeats.map((b) => b.repeat!.index)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    expect(repeats.every((b) => b.repeat!.total === 4 && b.repeat!.groupId === 'b1')).toBe(true);
  });

  it('grupo com k não múltiplo de N é inválido: perde os metadados de bloco, sem repeat', () => {
    const linhas = Array.from({ length: 7 }, () => etapa('ESFORCO', { id: 'b1', reps: 4 }));
    const entradas = indexarRepeticoes(linhas.map(fromEtapaTreino));
    expect(entradas.every((e) => e.blocoId === undefined && e.blocoRepeticaoIndex === undefined)).toBe(true);
    // O perfil pode inferir série por padrão repetido (inferirSeries) — isso é dele; o que o
    // adapter garante é que nenhum bracket vem do blocoId inválido.
    const profile = selectWorkoutProfile(entradas, { sport: 'run' });
    expect(profile.blocks.some((b) => b.repeat?.groupId === 'b1')).toBe(false);
  });

  it('sem bloco passa inalterado; bloco de 1 repetição ou sem N perde os metadados (não bloqueia a inferência); blocos distintos não se misturam', () => {
    const linhas = [
      etapa('AQUECIMENTO', undefined, 10),
      etapa('ESFORCO', { id: 'b1', reps: 2 }), etapa('ESFORCO', { id: 'b1', reps: 2 }),
      etapa('ESFORCO', { id: 'b2', reps: 1 }),
      etapa('ESFORCO', { id: 'b3', reps: 3 }), etapa('ESFORCO', { id: 'b3', reps: 3 }), etapa('ESFORCO', { id: 'b3', reps: 3 }),
      { tipoEtapa: 'ESFORCO', duracaoMin: 3, blocoId: 'b4' } as EtapaTreino, // blocoId sem blocoRepeticoes
    ];
    const entradas = indexarRepeticoes(linhas.map(fromEtapaTreino));
    expect(entradas.map((e) => e.blocoRepeticaoIndex)).toEqual([undefined, 1, 2, undefined, 1, 2, 3, undefined]);
    expect(entradas[3].blocoId).toBeUndefined();
    expect(entradas[7].blocoId).toBeUndefined();
  });

  it('o mesmo blocoId em dois segmentos separados é inválido: nenhum dos dois ganha bracket', () => {
    const linhas = [
      etapa('ESFORCO', { id: 'b1', reps: 2 }), etapa('ESFORCO', { id: 'b1', reps: 2 }),
      etapa('RECUPERACAO', undefined, 5),
      etapa('ESFORCO', { id: 'b1', reps: 2 }), etapa('ESFORCO', { id: 'b1', reps: 2 }),
    ];
    const entradas = indexarRepeticoes(linhas.map(fromEtapaTreino));
    expect(entradas.every((e) => e.blocoId === undefined)).toBe(true);
  });
});
