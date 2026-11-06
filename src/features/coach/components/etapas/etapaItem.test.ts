import { describe, it, expect } from 'vitest';
import {
    duracaoInvalida, formatarDuracao, itensFromEtapas, itensInvalidos, normalizarDuracao, recalcularMedidas, resumoDaSerie,
    segundosDe, serializarItens, totaisDeItens, totaisDoItem, type CampoEditado, type MedidasEtapa,
} from './etapaItem';
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
        expect(bloco.steps[0].duracao).toBe('1:00');
        expect(bloco.steps[1].duracao).toBe('2:00');
    });

    it('separa dois blocos consecutivos numa série heterogênea', () => {
        const itens = itensFromEtapas(serieHeterogenea);

        expect(itens.map(i => i.kind)).toEqual(['block', 'block']);
        const [primeiro, segundo] = itens;
        if (primeiro.kind !== 'block' || segundo.kind !== 'block') throw new Error('esperados blocos');
        expect(primeiro.repeticoes).toBe('2');
        expect(primeiro.steps[0].duracao).toBe('1:00');
        expect(segundo.repeticoes).toBe('2');
        expect(segundo.steps[0].duracao).toBe('2:00');
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

    it('apara a descrição só na serialização — espaço nas pontas não vai ao backend', () => {
        const itens = itensFromEtapas([
            { ordem: 1, tipoEtapa: 'PRINCIPAL', duracaoMin: 30, fcAlvoEtapa: 'Z2', descricaoEtapa: '  Tiro forte  ' },
            { ordem: 2, tipoEtapa: 'RECUPERACAO', duracaoMin: 5, fcAlvoEtapa: 'Z1', descricaoEtapa: '   ' },
        ]);
        expect(serializarItens(itens).map(p => p.descricaoEtapa)).toEqual(['Tiro forte', undefined]);
    });

    it('etapa sem descrição continua sem descrição — não inventa texto', () => {
        const payload = serializarItens(itensFromEtapas([
            { ordem: 1, tipoEtapa: 'PRINCIPAL', duracaoMin: 30, fcAlvoEtapa: 'Z2' },
        ]));
        expect(payload[0].descricaoEtapa).toBeUndefined();
    });
});

describe('etapaItem — o eixo do relógio (alvoPrimario) sobrevive ao round-trip', () => {
    it('hidrata alvoPrimario da etapa e o devolve no payload', () => {
        const itens = itensFromEtapas([
            { ordem: 1, tipoEtapa: 'INTERVALADO', duracaoMin: 4, fcAlvoEtapa: '168-178 bpm', ritmoAlvo: '4:30-4:45/km', alvoPrimario: 'PACE' },
        ]);

        const passo = itens[0];
        expect(passo.kind === 'step' && passo.alvoPrimario).toBe('PACE');
        expect(serializarItens(itens)[0]).toMatchObject({
            fcAlvoEtapa: '168-178 bpm',
            ritmoAlvo: '4:30-4:45/km',
            alvoPrimario: 'PACE',
        });
    });

    it('etapa legada sem alvoPrimario continua sem — o backend segue derivando', () => {
        const payload = serializarItens(itensFromEtapas([{ ordem: 1, tipoEtapa: 'PRINCIPAL', duracaoMin: 30, fcAlvoEtapa: '140-150 bpm' }]));

        expect(payload[0].alvoPrimario).toBeUndefined();
    });

    it('NENHUM explícito sobrevive mesmo com texto nos campos', () => {
        const payload = serializarItens(itensFromEtapas([
            { ordem: 1, tipoEtapa: 'PRINCIPAL', duracaoMin: 30, fcAlvoEtapa: 'trote leve', alvoPrimario: 'NENHUM' },
        ]));

        expect(payload[0]).toMatchObject({ fcAlvoEtapa: 'trote leve', alvoPrimario: 'NENHUM' });
    });

    it('sub-etapas de bloco levam o eixo cada uma', () => {
        const etapas: EtapaTreinoDto[] = [0, 1, 2].flatMap((i) => [
            { ordem: i * 2 + 1, tipoEtapa: 'INTERVALADO', duracaoMin: 3, ritmoAlvo: '4:00-4:10/km', alvoPrimario: 'PACE' as const, blocoId: 'b', blocoRepeticoes: 3 },
            { ordem: i * 2 + 2, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, fcAlvoEtapa: '120-136 bpm', alvoPrimario: 'FC' as const, blocoId: 'b', blocoRepeticoes: 3 },
        ]);

        const bloco = serializarItens(itensFromEtapas(etapas))[0];

        expect(bloco.subEtapas?.map((s) => s.alvoPrimario)).toEqual(['PACE', 'FC']);
    });

    it('etapas iguais com eixos diferentes não viram repetição (assinatura inclui alvoPrimario)', () => {
        const base = { tipoEtapa: 'INTERVALADO', duracaoMin: 1, fcAlvoEtapa: '150-160 bpm', ritmoAlvo: '4:30-4:45/km' };
        const recup = { tipoEtapa: 'RECUPERACAO', duracaoMin: 2 };
        const itens = itensFromEtapas([
            { ordem: 1, ...base, alvoPrimario: 'PACE' },
            { ordem: 2, ...recup },
            { ordem: 3, ...base, alvoPrimario: 'FC' },
            { ordem: 4, ...recup },
        ]);

        expect(itens.every((i) => i.kind === 'step')).toBe(true);
        expect(itens).toHaveLength(4);
    });

    it('etapas idênticas com o mesmo eixo continuam agrupando em série', () => {
        const base = { tipoEtapa: 'INTERVALADO', duracaoMin: 1, ritmoAlvo: '4:30-4:45/km', alvoPrimario: 'PACE' as const };
        const recup = { tipoEtapa: 'RECUPERACAO', duracaoMin: 2 };
        const itens = itensFromEtapas([
            { ordem: 1, ...base }, { ordem: 2, ...recup }, { ordem: 3, ...base }, { ordem: 4, ...recup },
        ]);

        expect(itens).toHaveLength(1);
        expect(itens[0].kind).toBe('block');
    });
});

describe('duração em m:ss', () => {
    it('segundosDe aceita m, m:ss e h:mm:ss; rejeita o resto', () => {
        expect(segundosDe('4')).toBe(240);
        expect(segundosDe('4:10')).toBe(250);
        expect(segundosDe('4:7')).toBe(247);
        expect(segundosDe('0:10')).toBe(10);
        expect(segundosDe('1:30:00')).toBe(5400);
        expect(segundosDe(' 4:10 ')).toBe(250);
        expect(segundosDe('')).toBeNull();
        expect(segundosDe('abc')).toBeNull();
        expect(segundosDe('4:70')).toBeNull();
        expect(segundosDe('4:')).toBeNull();
        expect(segundosDe('4.5')).toBeNull();
    });

    it('formatarDuracao e normalizarDuracao', () => {
        expect(formatarDuracao(250)).toBe('4:10');
        expect(formatarDuracao(240)).toBe('4:00');
        expect(formatarDuracao(10)).toBe('0:10');
        expect(formatarDuracao(5400)).toBe('1:30:00');
        expect(normalizarDuracao('4')).toBe('4:00');
        expect(normalizarDuracao('4:7')).toBe('4:07');
        expect(normalizarDuracao('abc')).toBe('abc');
        expect(normalizarDuracao('')).toBe('');
    });

    it('duracaoInvalida: vazio não é inválido, texto que não parseia é', () => {
        expect(duracaoInvalida('')).toBe(false);
        expect(duracaoInvalida('4:10')).toBe(false);
        expect(duracaoInvalida('abc')).toBe(true);
        expect(duracaoInvalida('0:00')).toBe(true);
        expect(duracaoInvalida('0')).toBe(true);
        expect(itensInvalidos([{ id: 'e', kind: 'step', tipoEtapa: 'PRINCIPAL', duracao: 'abc', distanciaKm: '', fcAlvoEtapa: '' }])).toBe(true);
        expect(itensInvalidos([{ id: 'b', kind: 'block', repeticoes: '3', steps: [{ id: 's', tipoEtapa: 'PRINCIPAL', duracao: '4:', distanciaKm: '', fcAlvoEtapa: '' }] }])).toBe(true);
        expect(itensInvalidos([{ id: 'e', kind: 'step', tipoEtapa: 'PRINCIPAL', duracao: '4:10', distanciaKm: '', fcAlvoEtapa: '' }])).toBe(false);
    });

    it('serializa duracaoSeg e o duracaoMin derivado; abaixo de 30 s omite o minuto', () => {
        const [a, b, c] = serializarItens([
            { id: 'a', kind: 'step', tipoEtapa: 'INTERVALADO', duracao: '4:10', distanciaKm: '', fcAlvoEtapa: '' },
            { id: 'b', kind: 'step', tipoEtapa: 'INTERVALADO', duracao: '0:10', distanciaKm: '', fcAlvoEtapa: '' },
            { id: 'c', kind: 'step', tipoEtapa: 'INTERVALADO', duracao: '4', distanciaKm: '', fcAlvoEtapa: '' },
        ]);
        expect(a).toMatchObject({ duracaoSeg: 250, duracaoMin: 4 });
        expect(b.duracaoSeg).toBe(10);
        expect(b.duracaoMin).toBeUndefined();
        expect(c).toMatchObject({ duracaoSeg: 240, duracaoMin: 4 });
    });

    it('hidrata duracaoSeg em m:ss; só duracaoMin vira m:00', () => {
        const [a, b] = itensFromEtapas([
            { ordem: 1, tipoEtapa: 'INTERVALADO', duracaoSeg: 250, duracaoMin: 4 },
            { ordem: 2, tipoEtapa: 'RECUPERACAO', duracaoMin: 2 },
        ]);
        expect(a).toMatchObject({ duracao: '4:10' });
        expect(b).toMatchObject({ duracao: '2:00' });
        // Minuto 0 sem segundo (etapa legada) abre vazio, não `0:00`, que bloquearia o salvar.
        const [c] = itensFromEtapas([{ ordem: 1, tipoEtapa: 'RECUPERACAO', duracaoMin: 0 }]);
        expect(c).toMatchObject({ duracao: '' });
    });

    it('4:10 e 4:20 não viram a mesma etapa na inferência de série', () => {
        const tiro = (ordem: number, duracaoSeg: number) =>
            ({ ordem, tipoEtapa: 'INTERVALADO', duracaoSeg, duracaoMin: 4, ritmoAlvo: '4:10/km' });
        const recup = (ordem: number) => ({ ordem, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, fcAlvoEtapa: 'Z1' });
        expect(itensFromEtapas([tiro(1, 250), recup(2), tiro(3, 260), recup(4)]).map(i => i.kind)).toEqual(['step', 'step', 'step', 'step']);
        expect(itensFromEtapas([tiro(1, 250), recup(2), tiro(3, 250), recup(4)]).map(i => i.kind)).toEqual(['block']);
    });
});

describe('recalcularMedidas', () => {
    const medidas = (distanciaKm: string, duracao: string, ritmoAlvo: string, flags: Partial<MedidasEtapa> = {}): MedidasEtapa =>
        ({ distanciaKm, duracao, ritmoAlvo, ...flags });
    const rec = (antes: MedidasEtapa, depois: MedidasEtapa, editado: CampoEditado) => recalcularMedidas(antes, depois, editado);

    it('duração digitada deriva a distância vazia (CA6/CA7)', () => {
        expect(rec(medidas('', '', '4:50/km'), medidas('', '4', '4:50/km'), 'duracao'))
            .toEqual({ distanciaKm: '0.83', distanciaAuto: true, duracao: '4', duracaoAuto: false });
        expect(rec(medidas('0', '', '4:50/km'), medidas('0', '4:10', '4:50/km'), 'duracao').distanciaKm).toBe('0.86');
    });

    it('distância digitada deriva a duração vazia: 1 km a 4:10/km dá 4:10', () => {
        expect(rec(medidas('', '', '4:10/km'), medidas('1', '', '4:10/km'), 'distancia'))
            .toEqual({ distanciaKm: '1', distanciaAuto: false, duracao: '4:10', duracaoAuto: true });
    });

    it('faixa de pace usa o ponto médio', () => {
        expect(rec(medidas('', '', '4:00-4:20/km'), medidas('1', '', '4:00-4:20/km'), 'distancia').duracao).toBe('4:10');
        expect(rec(medidas('', '', '5:00-5:20/km'), medidas('', '31', '5:00-5:20/km'), 'duracao').distanciaKm).toBe('6');
    });

    it('valor digitado não muda: digitar a duração sobre distância digitada', () => {
        expect(rec(medidas('1.5', '4:00', '4:50/km'), medidas('1.5', '8:00', '4:50/km'), 'duracao'))
            .toEqual({ distanciaKm: '1.5', distanciaAuto: false, duracao: '8:00', duracaoAuto: false });
    });

    it('digitar a duração numa etapa cuja duração era derivada: ela vira manual e a distância fica', () => {
        expect(rec(medidas('1', '4:10', '4:10/km', { duracaoAuto: true }), medidas('1', '5:00', '4:10/km'), 'duracao'))
            .toEqual({ distanciaKm: '1', distanciaAuto: false, duracao: '5:00', duracaoAuto: false });
    });

    it('distância já calculada acompanha a duração', () => {
        expect(rec(medidas('0.83', '4:00', '4:50/km', { distanciaAuto: true }), medidas('0.83', '8:00', '4:50/km'), 'duracao').distanciaKm).toBe('1.66');
    });

    it('pace muda: só o campo derivado muda', () => {
        expect(rec(medidas('1', '4:10', '4:10/km', { duracaoAuto: true }), medidas('1', '4:10', '5:00/km'), 'pace'))
            .toEqual({ distanciaKm: '1', distanciaAuto: false, duracao: '5:00', duracaoAuto: true });
        expect(rec(medidas('0.83', '4:00', '4:50/km', { distanciaAuto: true }), medidas('0.83', '4:00', '5:00/km'), 'pace').distanciaKm).toBe('0.8');
    });

    it('pace muda sem campo derivado: deriva o vazio; com os dois preenchidos nada muda', () => {
        expect(rec(medidas('', '4:00', ''), medidas('', '4:00', '5:00/km'), 'pace')).toMatchObject({ distanciaKm: '0.8', distanciaAuto: true });
        expect(rec(medidas('2', '', ''), medidas('2', '', '5:00/km'), 'pace')).toMatchObject({ duracao: '10:00', duracaoAuto: true });
        expect(rec(medidas('2', '10:00', '5:00/km'), medidas('2', '10:00', '4:00/km'), 'pace'))
            .toEqual({ distanciaKm: '2', distanciaAuto: false, duracao: '10:00', duracaoAuto: false });
    });

    it('pace incompleto durante a digitação mantém valor e marcador', () => {
        expect(rec(medidas('0.83', '4:00', '4:50/km', { distanciaAuto: true }), medidas('0.83', '4:00', '5:0'), 'pace'))
            .toMatchObject({ distanciaKm: '0.83', distanciaAuto: true });
        expect(rec(medidas('1', '4:10', '4:10/km', { duracaoAuto: true }), medidas('1', '4:10', '5:'), 'pace'))
            .toMatchObject({ duracao: '4:10', duracaoAuto: true });
    });

    it('fonte apagada limpa a derivada', () => {
        expect(rec(medidas('0.83', '4:00', '4:50/km', { distanciaAuto: true }), medidas('0.83', '', '4:50/km'), 'duracao').distanciaKm).toBe('');
        expect(rec(medidas('0.83', '4:00', '4:50/km', { distanciaAuto: true }), medidas('0.83', '4:00', ''), 'pace').distanciaKm).toBe('');
        expect(rec(medidas('1', '4:10', '4:10/km', { duracaoAuto: true }), medidas('', '4:10', '4:10/km'), 'distancia').duracao).toBe('');
    });

    it('texto inválido na duração é do treinador: mudar distância ou pace não o sobrescreve', () => {
        expect(rec(medidas('1', '4:', '4:10/km'), medidas('2', '4:', '4:10/km'), 'distancia'))
            .toMatchObject({ duracao: '4:', duracaoAuto: false });
        expect(rec(medidas('1', '4:', '4:10/km'), medidas('1', '4:', '5:00/km'), 'pace'))
            .toMatchObject({ duracao: '4:', duracaoAuto: false });
    });

    it('duração inválida não deriva e não apaga a distância derivada', () => {
        expect(rec(medidas('0.83', '4:00', '4:50/km', { distanciaAuto: true }), medidas('0.83', '4:', '4:50/km'), 'duracao'))
            .toMatchObject({ distanciaKm: '0.83', distanciaAuto: true, duracaoAuto: false });
    });

    it('derivada fica fora do payload; digitada vai', () => {
        const [derivada, digitada] = serializarItens([
            { id: 'e1', kind: 'step', tipoEtapa: 'INTERVALADO', duracao: '4:00', distanciaKm: '0.83', fcAlvoEtapa: '', distanciaAuto: true },
            { id: 'e2', kind: 'step', tipoEtapa: 'INTERVALADO', duracao: '4:00', distanciaKm: '7', fcAlvoEtapa: '', distanciaAuto: false },
        ]);
        expect(derivada).not.toHaveProperty('distanciaAuto');
        expect(derivada.distanciaKm).toBeUndefined();
        expect(derivada.duracaoMin).toBe(4);
        expect(digitada.distanciaKm).toBe(7);
    });

    it('duração derivada fica fora do payload: o PATCH leva só a distância digitada', () => {
        const [p] = serializarItens([
            { id: 'e1', kind: 'step', tipoEtapa: 'INTERVALADO', duracao: '4:10', duracaoAuto: true, distanciaKm: '1', fcAlvoEtapa: '', ritmoAlvo: '4:10/km' },
        ]);
        expect(p).toMatchObject({ distanciaKm: 1, ritmoAlvo: '4:10/km' });
        expect(p.duracaoSeg).toBeUndefined();
        expect(p.duracaoMin).toBeUndefined();
    });

    it('hidratação deriva a duração vazia de distância × pace e marca como calculada', () => {
        const [item] = itensFromEtapas([{ ordem: 1, tipoEtapa: 'INTERVALADO', distanciaKm: 1, ritmoAlvo: '4:10/km' }]);
        expect(item).toMatchObject({ kind: 'step', duracao: '4:10', duracaoAuto: true, distanciaKm: '1' });
    });

    it('sub-etapa derivada também fica fora do payload', () => {
        const [bloco] = serializarItens([{
            id: 'b1', kind: 'block', repeticoes: '4',
            steps: [{ id: 's1', tipoEtapa: 'INTERVALADO', duracao: '4:00', distanciaKm: '0.83', fcAlvoEtapa: '', distanciaAuto: true }],
        }]);
        expect(bloco.subEtapas?.[0].distanciaKm).toBeUndefined();
    });

    it('hidratação deriva a distância vazia e marca como calculada', () => {
        const [item] = itensFromEtapas([{ ordem: 1, tipoEtapa: 'INTERVALADO', duracaoMin: 4, ritmoAlvo: '4:50/km' }]);
        expect(item).toMatchObject({ kind: 'step', distanciaKm: '0.83', distanciaAuto: true });

        const [gravada] = itensFromEtapas([{ ordem: 1, tipoEtapa: 'INTERVALADO', duracaoMin: 4, distanciaKm: 2, ritmoAlvo: '4:50/km' }]);
        expect(gravada).toMatchObject({ distanciaKm: '2' });
        expect((gravada as { distanciaAuto?: boolean }).distanciaAuto).toBeFalsy();
    });
});

describe('totais por item e resumo da série', () => {
    const serie = {
        id: 'b1', kind: 'block' as const, repeticoes: '4',
        steps: [
            { id: 's1', tipoEtapa: 'INTERVALADO', duracao: '4:00', distanciaKm: '0.83', fcAlvoEtapa: '' },
            { id: 's2', tipoEtapa: 'RECUPERACAO', duracao: '2:00', distanciaKm: '0.25', fcAlvoEtapa: '' },
        ],
    };

    it('a série conta N vezes as suas etapas', () => {
        expect(totaisDoItem(serie)).toEqual({ seg: 1440, km: 4.32 });
        expect(totaisDoItem({ id: 'e', kind: 'step', tipoEtapa: 'AQUECIMENTO', duracao: '10:00', distanciaKm: '1.5', fcAlvoEtapa: '' }))
            .toEqual({ seg: 600, km: 1.5 });
    });

    it('o total do treino é a soma dos itens', () => {
        const t = totaisDeItens([serie, { id: 'e', kind: 'step', tipoEtapa: 'AQUECIMENTO', duracao: '10:00', distanciaKm: '1.5', fcAlvoEtapa: '' }]);
        expect(t.seg).toBe(34 * 60);
        expect(t.km).toBeCloseTo(5.82);
    });

    it('resumo: repetições, minutos e km com vírgula; parte zerada some', () => {
        expect(resumoDaSerie(serie)).toBe('4× · 24 min · 4,3 km');
        expect(resumoDaSerie({ ...serie, steps: serie.steps.map((s) => ({ ...s, distanciaKm: '' })) })).toBe('4× · 24 min');
        expect(resumoDaSerie({ ...serie, repeticoes: '', steps: [] })).toBe('1×');
        // Com segundos o cabeçalho mostra m:ss, como o card — "17 min" esconderia o que a change traz.
        expect(resumoDaSerie({ ...serie, steps: [{ ...serie.steps[0], duracao: '4:10', distanciaKm: '' }] })).toBe('4× · 16:40');
    });
});
