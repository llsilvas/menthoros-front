import { describe, expect, it } from 'vitest';
import type { TreinoRealizadoDetalhe } from '../../../types/TreinoRealizado';
import {
    buildExecucaoFromDetalhe,
    formatarRitmo,
    formatarTempo,
    normalizarZonaAlvo,
    segundosDe,
} from './treinoRealizadoDetalheAdapters';

/**
 * Forma do `GET /api/v1/treinos/realizados/{id}` para o .fit de 15 km dos testes do backend
 * (`corrida-15km-16laps.fit`, D3). Números da sonda da task 0.1; zonas ilustrativas que somam 5.639 s.
 */
const DETALHE_FIT: TreinoRealizadoDetalhe = {
    id: 'tr-1',
    tipoTreino: 'LONGO',
    duracaoMin: '01:40:32',
    distanciaKm: 15.0,
    fcMedia: 152,
    fcMax: 171,
    cadenciaMedia: 165,
    potenciaMedia: 362,
    velocidadeMedia: 9.62,
    percepcaoEsforco: 7,
    elevacaoGanhoMetros: 65,
    elevacaoPerdaMetros: 57,
    feedbackAtleta: 'Pernas pesadas no fim',
    runningDynamics: {
        tempoMovimento: '01:33:33',
        calorias: 1120,
        gctMedioMs: 252,
        gctEquilibrioPct: 49.3,
        passadaMediaM: 1.05,
        oscilacaoVerticalCm: 8.2,
        proporcaoVerticalPct: 6.8,
        temperaturaMediaC: 22.0,
    },
    velocidadeMaxKmh: 12.19,
    temperaturaMinC: 19.0,
    temperaturaMaxC: 27.0,
    elapsedTimeSeg: 6032,
    tempoEmZonas: {
        fonte: 'FIT_RECORDS',
        zonas: [
            { zona: 'Z1', bpmMin: 93, bpmMax: 111, segundos: 4 },
            { zona: 'Z2', bpmMin: 112, bpmMax: 129, segundos: 108 },
            { zona: 'Z3', bpmMin: 130, bpmMax: 148, segundos: 4314 },
            { zona: 'Z4', bpmMin: 149, bpmMax: 166, segundos: 1198 },
            { zona: 'Z5', bpmMin: 167, segundos: 15 },
        ],
    },
    etapasRealizadas: [
        { ordem: 2, duracao: '06:05', distanciaKm: 1.0, velocidadeMedia: 9.86, fcMedia: 150, fcMax: 155, elevacaoGanhoMetros: 2, elevacaoPerdaMetros: 1 },
        { ordem: 1, duracao: '06:12', distanciaKm: 1.0, paceMedia: '06:12', fcMedia: 140, fcMax: 148, cadenciaMedia: 161, potenciaMedia: 351, elevacaoGanhoMetros: 4, elevacaoPerdaMetros: 0 },
    ],
};

const PLANEJADO = {
    distanciaKm: 14,
    duracaoMin: 'PT90M',
    ritmoAlvo: '6:00',
    zonaAlvo: 'Z3',
    percepcaoEsforcoEsperada: 6,
};

const linha = (rotulo: string, detalhe = DETALHE_FIT, planejado: Parameters<typeof buildExecucaoFromDetalhe>[1] = PLANEJADO) =>
    buildExecucaoFromDetalhe(detalhe, planejado).comparativo.find((l) => l.rotulo === rotulo)!;

describe('formatação', () => {
    it('segundosDe lê HH:MM:SS, MM:SS e ISO-8601; ilegível vira null', () => {
        expect(segundosDe('01:40:32')).toBe(6032);
        expect(segundosDe('06:12')).toBe(372);
        expect(segundosDe('PT1H30M')).toBe(5400);
        expect(segundosDe('abc')).toBeNull();
        expect(segundosDe(undefined)).toBeNull();
    });

    it('formatarTempo usa h:mm:ss acima de uma hora e m:ss abaixo', () => {
        expect(formatarTempo(6032)).toBe('1:40:32');
        expect(formatarTempo(372)).toBe('6:12');
        expect(formatarTempo(null)).toBe('--');
    });

    it('formatarRitmo prefere o texto e cai para a velocidade em km/h', () => {
        expect(formatarRitmo('05:45')).toBe('5:45 /km');
        expect(formatarRitmo(null, 12)).toBe('5:00 /km');
        expect(formatarRitmo(null, null)).toBe('--');
    });
});

describe('normalizarZonaAlvo', () => {
    it.each([
        ['Z2', [2]],
        ['z2-z3', [2, 3]],
        ['Z2 - Z4', [2, 3, 4]],
        ['z3-4', [3, 4]],
    ])('%s → %j', (texto, esperado) => {
        expect([...normalizarZonaAlvo(texto)]).toEqual(esperado);
    });

    it.each(['Z6', 'Z0', 'z4-z2', 'limiar', '', undefined, null])('%s → vazio', (texto) => {
        expect(normalizarZonaAlvo(texto).size).toBe(0);
    });
});

describe('buildExecucaoFromDetalhe — comparativo (D5)', () => {
    it('distância: diferença em km com vírgula; fora de ±10 % fica em atenção', () => {
        expect(linha('Distância')).toEqual({
            rotulo: 'Distância', planejado: '14,00 km', realizado: '15,00 km', diferenca: '+1,00 km', tom: 'ok',
        });
        expect(linha('Distância', DETALHE_FIT, { ...PLANEJADO, distanciaKm: 13 }).tom).toBe('atencao');
    });

    it('distância exatamente +10 % fica ok, apesar do ponto flutuante', () => {
        expect(linha('Distância', { ...DETALHE_FIT, distanciaKm: 8.8 }, { ...PLANEJADO, distanciaKm: 8 }).tom).toBe('ok');
    });

    it('duração decide pelo valor exato, não pelo arredondado da tela', () => {
        // 70min29s contra 60: a tela mostra +10, mas passa da tolerância
        const passou = { ...DETALHE_FIT, runningDynamics: { tempoMovimento: '01:10:29' } };
        expect(linha('Duração', passou, { ...PLANEJADO, duracaoMin: 'PT60M' })).toMatchObject({ diferenca: '+10 min', tom: 'atencao' });
        const noLimite = { ...DETALHE_FIT, runningDynamics: { tempoMovimento: '01:10:00' } };
        expect(linha('Duração', noLimite, { ...PLANEJADO, duracaoMin: 'PT60M' }).tom).toBe('ok');
    });

    it('zona: 59,5 % no alvo aparece "60%", mas fica em atenção', () => {
        const detalhe = {
            ...DETALHE_FIT,
            tempoEmZonas: { fonte: 'FIT_RECORDS', zonas: [
                { zona: 'Z2', bpmMin: 112, bpmMax: 129, segundos: 595 },
                { zona: 'Z3', bpmMin: 130, segundos: 405 },
            ] },
        };
        expect(linha('Zona', detalhe, { ...PLANEJADO, zonaAlvo: 'Z2' })).toMatchObject({ diferenca: '60% no alvo', tom: 'atencao' });
    });

    it('duração compara com o tempo em movimento, não com o elapsed', () => {
        // 93,5 min em movimento contra 90 planejados: +4 (elapsed daria +11, fora da tolerância)
        expect(linha('Duração')).toMatchObject({ planejado: '1:30:00', realizado: '1:33:33', diferenca: '+4 min', tom: 'ok' });
    });

    it('duração sem tempo em movimento cai para duracaoMin; minutos numéricos do legado também valem', () => {
        const semMovimento = { ...DETALHE_FIT, runningDynamics: undefined };
        expect(linha('Duração', semMovimento, { ...PLANEJADO, duracaoMin: 90 })).toMatchObject({
            realizado: '1:40:32', diferenca: '+11 min', tom: 'atencao',
        });
    });

    it('ritmo é neutro: alvo é texto livre; realizado sai da velocidade quando não há paceMedia', () => {
        expect(linha('Ritmo')).toEqual({
            rotulo: 'Ritmo', planejado: '6:00', realizado: '6:14 /km', diferenca: '--', tom: 'neutro',
        });
    });

    it('zona: predominante e "% no alvo"; ≥ 60 % fica ok', () => {
        expect(linha('Zona')).toMatchObject({ planejado: 'Z3', realizado: 'Z3', diferenca: '77% no alvo', tom: 'ok' });
        expect(linha('Zona', DETALHE_FIT, { ...PLANEJADO, zonaAlvo: 'Z4' })).toMatchObject({ diferenca: '21% no alvo', tom: 'atencao' });
    });

    it('zona alvo em faixa soma as zonas do intervalo', () => {
        expect(linha('Zona', DETALHE_FIT, { ...PLANEJADO, zonaAlvo: 'z3-z4' }).diferenca).toBe('98% no alvo');
    });

    it('zona alvo não reconhecida ou ausente: linha neutra', () => {
        expect(linha('Zona', DETALHE_FIT, { ...PLANEJADO, zonaAlvo: 'Z6' })).toMatchObject({ diferenca: '--', tom: 'neutro' });
        expect(linha('Zona', DETALHE_FIT, { ...PLANEJADO, zonaAlvo: undefined })).toMatchObject({ planejado: '--', tom: 'neutro' });
    });

    it('FC média só tem realizado e é neutra', () => {
        expect(linha('FC média')).toEqual({ rotulo: 'FC média', planejado: '--', realizado: '152 bpm', diferenca: '--', tom: 'neutro' });
    });

    it('RPE: ±1 ok, fora em atenção', () => {
        expect(linha('RPE')).toMatchObject({ planejado: '6/10', realizado: '7/10', diferenca: '+1', tom: 'ok' });
        expect(linha('RPE', { ...DETALHE_FIT, percepcaoEsforco: 9 }).tom).toBe('atencao');
    });

    it('lado ausente vira "--" e a linha fica neutra', () => {
        const vazio = buildExecucaoFromDetalhe({ id: 'x' }, {});
        expect(vazio.comparativo).toHaveLength(6);
        vazio.comparativo.forEach((l) => {
            expect(l.diferenca).toBe('--');
            expect(l.tom).toBe('neutro');
        });
    });

    it('distância planejada 0 é tratada como ausente', () => {
        expect(linha('Distância', DETALHE_FIT, { ...PLANEJADO, distanciaKm: 0 })).toMatchObject({ planejado: '--', tom: 'neutro' });
    });
});

describe('buildExecucaoFromDetalhe — zonas, etapas e acordeão', () => {
    it('faixa de zonas: percentual, tempo, limites e alvo destacado; zona do topo sem teto', () => {
        const { zonas } = buildExecucaoFromDetalhe(DETALHE_FIT, PLANEJADO);
        expect(zonas?.faixas[2]).toEqual({ zona: 'Z3', segundos: 4314, percentual: 77, tempo: '1:11:54', limites: '130–148 bpm', alvo: true });
        expect(zonas?.faixas[4].limites).toBe('≥ 167 bpm');
        expect(zonas?.faixas.filter((f) => f.alvo)).toHaveLength(1);
    });

    it('sem tempoEmZonas: zonas nulas', () => {
        expect(buildExecucaoFromDetalhe({ ...DETALHE_FIT, tempoEmZonas: undefined }, PLANEJADO).zonas).toBeNull();
    });

    it('etapas em ordem; ritmo da volta sai do texto ou da velocidade; Total vem da sessão', () => {
        const { etapas, total } = buildExecucaoFromDetalhe(DETALHE_FIT, PLANEJADO);
        expect(etapas.map((e) => e.rotulo)).toEqual(['Volta 1', 'Volta 2']);
        expect(etapas[0]).toMatchObject({ ritmo: '6:12 /km', cadencia: '161 ppm', potencia: '351 W', elevacao: '+4 m / −0 m' });
        // Lado ausente não vira zero
        expect(buildExecucaoFromDetalhe({ id: 'x', etapasRealizadas: [{ ordem: 1, elevacaoGanhoMetros: 12 }] }, {}).etapas[0].elevacao)
            .toBe('+12 m / --');
        expect(etapas[1]).toMatchObject({ ritmo: '6:05 /km', cadencia: '--', potencia: '--' });
        // Soma das duas voltas daria 2 km; a sessão tem 15 (CA11)
        expect(total).toMatchObject({ rotulo: 'Total', distancia: '15,00 km', tempo: '1:40:32', fcMax: '171 bpm' });
    });

    it('treino manual sem voltas e sem zonas: etapas vazias e Total nulo', () => {
        const manual = buildExecucaoFromDetalhe({ id: 'm', duracaoMin: '45:00', distanciaKm: 8, percepcaoEsforco: 5 }, PLANEJADO);
        expect(manual.etapas).toEqual([]);
        expect(manual.total).toBeNull();
        expect(manual.zonas).toBeNull();
    });

    it('acordeão: percepção só com RPE e comentário; ausentes viram "--"', () => {
        const { grupos } = buildExecucaoFromDetalhe(DETALHE_FIT, PLANEJADO);
        const percepcao = grupos.find((g) => g.titulo === 'Percepção do atleta')!;
        expect(percepcao.itens).toEqual([
            { rotulo: 'Esforço percebido', valor: '7/10' },
            { rotulo: 'Comentário', valor: 'Pernas pesadas no fim' },
        ]);
        const valor = (titulo: string, rotulo: string) =>
            grupos.find((g) => g.titulo === titulo)!.itens.find((i) => i.rotulo === rotulo)!.valor;
        expect(valor('Distância e tempo', 'Tempo decorrido')).toBe('1:40:32');
        expect(valor('Ritmo', 'Melhor ritmo')).toBe('4:55 /km');
        expect(valor('Ambiente e corpo', 'Temperatura média')).toBe('22,0 °C');
        expect(valor('Ambiente e corpo', 'Temperatura mínima')).toBe('19 °C');
        expect(valor('Ambiente e corpo', 'Temperatura máxima')).toBe('27 °C');
        // Extremos independentes da média
        const soExtremos = buildExecucaoFromDetalhe({ id: 'x', temperaturaMaxC: 30 }, {}).grupos
            .find((g) => g.titulo === 'Ambiente e corpo')!.itens.map((i) => i.valor);
        expect(soExtremos).toEqual(['--', '--', '30 °C', '--']);
        expect(valor('Dinâmica de corrida', 'Equilíbrio de GCT')).toBe('49,3% E / 50,7% D');

        const vazio = buildExecucaoFromDetalhe({ id: 'x' }, {}).grupos.flatMap((g) => g.itens.map((i) => i.valor));
        expect(new Set(vazio)).toEqual(new Set(['--']));
    });
});
