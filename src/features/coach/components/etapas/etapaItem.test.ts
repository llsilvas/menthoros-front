import { describe, it, expect } from 'vitest';
import { itensFromEtapas, serializarItens } from './etapaItem';
import type { EtapaTreinoDto } from '../../../../types/PlanoReview';

/**
 * Hidratação de etapas planas para o modelo de edição, e o caminho de volta.
 *
 * Os fixtures de agrupamento espelham `IntervalsIcuWorkoutConverterTest` no backend
 * (`services/helper/IntervalsIcuWorkoutConverterTest.java`) — a mesma regra existe nos dois lados,
 * um para exportar ao relógio e outro para alimentar o editor. Ao mexer em um, conferir o outro:
 * divergência entre eles aparece para o treinador como "editei uma coisa e o Garmin mostrou outra".
 */

const etapa = (
    ordem: number,
    tipoEtapa: string,
    duracaoMin: number,
    fcAlvoEtapa?: string,
    blocoId?: string,
    blocoRepeticoes?: number,
): EtapaTreinoDto => ({ ordem, tipoEtapa, duracaoMin, fcAlvoEtapa, blocoId, blocoRepeticoes });

/** 4 pares idênticos, como a expansão do LLM produz — sem blocoId. */
const fartlekExpandido: EtapaTreinoDto[] = [
    etapa(1, 'AQUECIMENTO', 10, 'Z2'),
    etapa(2, 'INTERVALADO', 1, 'Z4'),
    etapa(3, 'RECUPERACAO', 2, 'Z1'),
    etapa(4, 'INTERVALADO', 1, 'Z4'),
    etapa(5, 'RECUPERACAO', 2, 'Z1'),
    etapa(6, 'INTERVALADO', 1, 'Z4'),
    etapa(7, 'RECUPERACAO', 2, 'Z1'),
    etapa(8, 'INTERVALADO', 1, 'Z4'),
    etapa(9, 'RECUPERACAO', 2, 'Z1'),
    etapa(10, 'DESAQUECIMENTO', 5, 'Z1'),
];

/** Série heterogênea: 2× (1min Z4 + 2min Z1) e depois 2× (2min Z5 + 3min Z1). */
const serieHeterogenea: EtapaTreinoDto[] = [
    etapa(1, 'INTERVALADO', 1, 'Z4'),
    etapa(2, 'RECUPERACAO', 2, 'Z1'),
    etapa(3, 'INTERVALADO', 1, 'Z4'),
    etapa(4, 'RECUPERACAO', 2, 'Z1'),
    etapa(5, 'INTERVALADO', 2, 'Z5'),
    etapa(6, 'RECUPERACAO', 3, 'Z1'),
    etapa(7, 'INTERVALADO', 2, 'Z5'),
    etapa(8, 'RECUPERACAO', 3, 'Z1'),
];

describe('itensFromEtapas', () => {
    it('agrupa por blocoId quando existe (dado explícito vence inferência)', () => {
        const bloco = 'bloco-1';
        const itens = itensFromEtapas([
            etapa(1, 'INTERVALADO', 3, 'Z5', bloco, 4),
            etapa(2, 'RECUPERACAO', 2, 'Z1', bloco, 4),
            etapa(3, 'INTERVALADO', 3, 'Z5', bloco, 4),
            etapa(4, 'RECUPERACAO', 2, 'Z1', bloco, 4),
            etapa(5, 'INTERVALADO', 3, 'Z5', bloco, 4),
            etapa(6, 'RECUPERACAO', 2, 'Z1', bloco, 4),
            etapa(7, 'INTERVALADO', 3, 'Z5', bloco, 4),
            etapa(8, 'RECUPERACAO', 2, 'Z1', bloco, 4),
        ]);

        expect(itens).toHaveLength(1);
        const item = itens[0];
        expect(item.kind).toBe('block');
        if (item.kind !== 'block') throw new Error('esperado bloco');
        expect(item.repeticoes).toBe('4');
        expect(item.steps).toHaveLength(2);
        expect(item.steps[0].tipoEtapa).toBe('INTERVALADO');
        expect(item.steps[1].tipoEtapa).toBe('RECUPERACAO');
    });

    it('infere o bloco quando não há blocoId (treino gerado pela IA)', () => {
        const itens = itensFromEtapas(fartlekExpandido);

        expect(itens.map(i => i.kind)).toEqual(['step', 'block', 'step']);
        const bloco = itens[1];
        if (bloco.kind !== 'block') throw new Error('esperado bloco');
        expect(bloco.repeticoes).toBe('4');
        expect(bloco.steps).toHaveLength(2);
        expect(bloco.steps[0].duracaoMin).toBe('1');
        expect(bloco.steps[1].duracaoMin).toBe('2');
    });

    it('separa dois blocos consecutivos numa série heterogênea', () => {
        const itens = itensFromEtapas(serieHeterogenea);

        expect(itens.map(i => i.kind)).toEqual(['block', 'block']);
        const [primeiro, segundo] = itens;
        if (primeiro.kind !== 'block' || segundo.kind !== 'block') throw new Error('esperados blocos');
        expect(primeiro.repeticoes).toBe('2');
        expect(primeiro.steps[0].duracaoMin).toBe('1');
        expect(segundo.repeticoes).toBe('2');
        expect(segundo.steps[0].duracaoMin).toBe('2');
    });

    it('não inventa bloco em etapas heterogêneas sem repetição', () => {
        const itens = itensFromEtapas([
            etapa(1, 'AQUECIMENTO', 10, 'Z2'),
            etapa(2, 'PRINCIPAL', 30, 'Z3'),
            etapa(3, 'DESAQUECIMENTO', 5, 'Z1'),
        ]);

        expect(itens.map(i => i.kind)).toEqual(['step', 'step', 'step']);
    });

    it('não agrupa repetição sem etapa INTERVALADO — repetição não é série', () => {
        // Mesma regra do IntervalsIcuWorkoutConverter: um ondulado A B A B não é uma série,
        // e transformá-lo em bloco inventaria estrutura que o treinador não prescreveu.
        const itens = itensFromEtapas([
            etapa(1, 'PRINCIPAL', 10, 'Z2'),
            etapa(2, 'PRINCIPAL', 5, 'Z3'),
            etapa(3, 'PRINCIPAL', 10, 'Z2'),
            etapa(4, 'PRINCIPAL', 5, 'Z3'),
        ]);

        expect(itens.map(i => i.kind)).toEqual(['step', 'step', 'step', 'step']);
    });

    it('degrada para etapas avulsas quando blocoRepeticoes não divide o grupo', () => {
        const bloco = 'bloco-torto';
        const itens = itensFromEtapas([
            etapa(1, 'INTERVALADO', 3, 'Z5', bloco, 4),
            etapa(2, 'RECUPERACAO', 2, 'Z1', bloco, 4),
            etapa(3, 'INTERVALADO', 3, 'Z5', bloco, 4),
        ]);

        expect(itens.map(i => i.kind)).toEqual(['step', 'step', 'step']);
    });

    it('lista vazia devolve lista vazia', () => {
        expect(itensFromEtapas([])).toEqual([]);
        expect(itensFromEtapas(undefined)).toEqual([]);
    });
});

describe('round-trip serializarItens ∘ itensFromEtapas', () => {
    const semRuido = (e: { tipoEtapa: string; duracaoMin?: number; fcAlvoEtapa?: string }) => ({
        tipoEtapa: e.tipoEtapa, duracaoMin: e.duracaoMin, fcAlvoEtapa: e.fcAlvoEtapa,
    });

    it('preserva conteúdo e ordem de uma série heterogênea', () => {
        // O teste que mais protege o design: abrir o editor e salvar sem alterar nada não pode
        // mudar o treino. É o CA1 da change, e o que falhava antes dela.
        const payload = serializarItens(itensFromEtapas(serieHeterogenea));

        // dois blocos de 2 repetições, cada um com 2 sub-etapas
        expect(payload).toHaveLength(2);
        expect(payload[0]).toMatchObject({ tipoEtapa: 'BLOCO', blocoRepeticoes: 2 });
        expect(payload[1]).toMatchObject({ tipoEtapa: 'BLOCO', blocoRepeticoes: 2 });

        // expandindo o payload de volta, o conteúdo bate etapa a etapa com o original
        const expandido = payload.flatMap(p =>
            p.tipoEtapa === 'BLOCO'
                ? Array.from({ length: p.blocoRepeticoes ?? 1 }, () => p.subEtapas ?? []).flat()
                : [p],
        );
        expect(expandido.map(semRuido)).toEqual(serieHeterogenea.map(semRuido));
    });

    it('preserva um fartlek expandido, com aquecimento e desaquecimento avulsos', () => {
        const payload = serializarItens(itensFromEtapas(fartlekExpandido));

        const expandido = payload.flatMap(p =>
            p.tipoEtapa === 'BLOCO'
                ? Array.from({ length: p.blocoRepeticoes ?? 1 }, () => p.subEtapas ?? []).flat()
                : [p],
        );
        expect(expandido.map(semRuido)).toEqual(fartlekExpandido.map(semRuido));
    });

    it('preserva um treino simples sem criar bloco', () => {
        const simples: EtapaTreinoDto[] = [
            etapa(1, 'AQUECIMENTO', 10, 'Z2'),
            etapa(2, 'PRINCIPAL', 30, 'Z3'),
            etapa(3, 'DESAQUECIMENTO', 5, 'Z1'),
        ];

        const payload = serializarItens(itensFromEtapas(simples));

        expect(payload.every(p => p.tipoEtapa !== 'BLOCO')).toBe(true);
        expect(payload.map(semRuido)).toEqual(simples.map(semRuido));
    });
});
