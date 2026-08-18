import { describe, it, expect } from 'vitest';
import { fromEtapaTreino, fromEtapaTreinoDto, fromEtapaItens } from './input';
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

  // O tipo do detalhe não tem blocoId, e inferir grupo por igualdade de rótulo
  // seria adivinhação apresentada como estrutura.
  it('nunca produz blocoId — o tipo de origem não tem essa informação', () => {
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
