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

// ── Ritmo da etapa ────────────────────────────────────────────────────────────

describe('etapaItem — o ritmo sobrevive ao round-trip', () => {
    // Terceira ocorrência do mesmo defeito, depois de `blocoId` e `descricaoEtapa`: o PATCH limpa
    // as etapas e as reconstrói a partir do payload, então campo que o editor não devolve nasce
    // nulo. Aqui o dado vem do planner — o schema do structured output exige `ritmoAlvo` por etapa
    // —, e o coach perdia a prescrição de ritmo ao salvar qualquer edição administrativa.
    const comRitmo: EtapaTreinoDto[] = [
        { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10, fcAlvoEtapa: '115-130 bpm' },
        { ordem: 2, tipoEtapa: 'PRINCIPAL', duracaoMin: 35, fcAlvoEtapa: '', ritmoAlvo: '5:00-5:15/km' },
    ];

    it('hidrata o ritmo para o modelo de edição', () => {
        const itens = itensFromEtapas(comRitmo);
        const principal = itens[1];
        expect(principal.kind).toBe('step');
        expect(principal.kind === 'step' && principal.ritmoAlvo).toBe('5:00-5:15/km');
    });

    it('devolve o ritmo no payload de salvamento', () => {
        const payload = serializarItens(itensFromEtapas(comRitmo));
        expect(payload.map(p => p.ritmoAlvo)).toEqual([undefined, '5:00-5:15/km']);
    });

    it('preserva o ritmo dentro de uma série', () => {
        const serie: EtapaTreinoDto[] = Array.from({ length: 3 }, (_, i) => [
            { ordem: i * 2 + 1, tipoEtapa: 'INTERVALADO', duracaoMin: 3, ritmoAlvo: '4:00-4:10/km' },
            { ordem: i * 2 + 2, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, ritmoAlvo: '6:30-7:00/km' },
        ]).flat();

        const bloco = serializarItens(itensFromEtapas(serie))[0];
        expect(bloco.tipoEtapa).toBe('BLOCO');
        expect(bloco.subEtapas?.map(s => s.ritmoAlvo)).toEqual(['4:00-4:10/km', '6:30-7:00/km']);
    });

    it('etapas de mesma duração e ritmos diferentes não viram série', () => {
        // A assinatura da janela inclui o ritmo, espelhando etapasEquivalentes no backend. Sem
        // isso, um progressivo (mesma duração, ritmo caindo a cada trecho) seria agrupado como
        // repetição — e o editor mostraria uma série que o treinador não prescreveu.
        const progressivo: EtapaTreinoDto[] = [
            { ordem: 1, tipoEtapa: 'INTERVALADO', duracaoMin: 5, ritmoAlvo: '5:00-5:10/km' },
            { ordem: 2, tipoEtapa: 'INTERVALADO', duracaoMin: 5, ritmoAlvo: '4:40-4:50/km' },
            { ordem: 3, tipoEtapa: 'INTERVALADO', duracaoMin: 5, ritmoAlvo: '4:20-4:30/km' },
            { ordem: 4, tipoEtapa: 'INTERVALADO', duracaoMin: 5, ritmoAlvo: '4:00-4:10/km' },
        ];

        const itens = itensFromEtapas(progressivo);

        expect(itens.every(i => i.kind === 'step')).toBe(true);
        expect(itens).toHaveLength(4);
    });
});

// ── Descrição da etapa ────────────────────────────────────────────────────────

describe('etapaItem — a descrição sobrevive ao round-trip', () => {
    // Abrir um treino no editor e salvar apagava `descricaoEtapa` de todas as
    // etapas, em silêncio: o modelo de edição não tinha o campo, e a
    // serialização não o emitia. É perda de dado num caminho de escrita do plano
    // do atleta — o coach escreve "Corrida contínua Z2" e o texto some na
    // primeira edição administrativa.
    const comDescricao: EtapaTreinoDto[] = [
        { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10, fcAlvoEtapa: 'Z2', descricaoEtapa: 'Solto, progressivo' },
        { ordem: 2, tipoEtapa: 'PRINCIPAL', duracaoMin: 35, fcAlvoEtapa: '', descricaoEtapa: 'Corrida contínua Z2' },
        { ordem: 3, tipoEtapa: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvoEtapa: 'Z1' },
    ];

    it('hidrata a descrição para o modelo de edição', () => {
        const itens = itensFromEtapas(comDescricao);
        const principal = itens[1];
        expect(principal.kind).toBe('step');
        expect(principal.kind === 'step' && principal.descricaoEtapa).toBe('Corrida contínua Z2');
    });

    it('devolve a descrição no payload de salvamento', () => {
        const payload = serializarItens(itensFromEtapas(comDescricao));
        expect(payload.map(p => p.descricaoEtapa))
            .toEqual(['Solto, progressivo', 'Corrida contínua Z2', undefined]);
    });

    it('preserva a descrição dentro de uma série', () => {
        const serie: EtapaTreinoDto[] = Array.from({ length: 3 }, (_, i) => [
            { ordem: i * 2 + 1, tipoEtapa: 'INTERVALADO', duracaoMin: 3, fcAlvoEtapa: 'Z4', descricaoEtapa: 'Tiro forte' },
            { ordem: i * 2 + 2, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, fcAlvoEtapa: 'Z1', descricaoEtapa: 'Trote' },
        ]).flat();

        const bloco = serializarItens(itensFromEtapas(serie))[0];
        expect(bloco.tipoEtapa).toBe('BLOCO');
        expect(bloco.subEtapas?.map(s => s.descricaoEtapa)).toEqual(['Tiro forte', 'Trote']);
    });

    it('etapa sem descrição continua sem descrição — não inventa texto', () => {
        const payload = serializarItens(itensFromEtapas([
            { ordem: 1, tipoEtapa: 'PRINCIPAL', duracaoMin: 30, fcAlvoEtapa: 'Z2' },
        ]));
        expect(payload[0].descricaoEtapa).toBeUndefined();
    });
});
