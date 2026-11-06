import { describe, expect, it } from 'vitest';
import { toEditorTreino } from './toEditorTreino';
import { itensFromEtapas } from '../../../features/coach/components/etapas/etapaItem';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';

// JSON como a listagem `GET /planos/atletas/{id}/semanas` serializa: enums do treino como objeto,
// duração do treino em `HH:MM:SS`/`MM:SS` (TreinoMapper.durationToString), etapa com minutos inteiros.
const LISTAGEM = {
    id: 't1',
    tipoTreino: { value: 'INTERVALADO', label: 'Intervalado' },
    diaSemana: { value: 'QUINTA', label: 'Quinta', short: 'Qui', order: 4 },
    dataTreino: '2026-11-06',
    distanciaKm: 12.5,
    duracaoMin: '01:05:00',
    observacao: 'Segurar o ritmo no último tiro',
    descricao: 'Tiros de 1 km',
    zonaAlvo: 'Z4',
    percepcaoEsforcoEsperada: 7,
    tssPlanejado: 88,
    justificativaIa: 'Semana de pico',
    statusTreino: { value: 'PENDENTE', label: 'Pendente' },
    editable: true,
    etapas: [
        { ordem: 1, tipoEtapa: 'AQUECIMENTO', descricaoEtapa: 'Trote', duracaoMin: 15, fcAlvoEtapa: '120-140 bpm', alvoPrimario: 'FC' },
        { ordem: 2, tipoEtapa: { value: 'INTERVALADO', label: 'Intervalado' }, descricaoEtapa: 'Tiro', duracaoMin: 4, distanciaKm: 1, ritmoAlvo: '4:00-4:10/km', alvoPrimario: 'PACE', blocoId: 'b1', blocoRepeticoes: 2 },
        { ordem: 3, tipoEtapa: 'RECUPERACAO', descricaoEtapa: 'Trote leve', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
        { ordem: 4, tipoEtapa: 'INTERVALADO', descricaoEtapa: 'Tiro', duracaoMin: 4, distanciaKm: 1, ritmoAlvo: '4:00-4:10/km', alvoPrimario: 'PACE', blocoId: 'b1', blocoRepeticoes: 2 },
        { ordem: 5, tipoEtapa: 'RECUPERACAO', descricaoEtapa: 'Trote leve', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
    ],
} as unknown as TreinoPlanejado;

describe('toEditorTreino', () => {
    it('preserva observação, TSS, zona, RPE, descrição e justificativa', () => {
        const dto = toEditorTreino(LISTAGEM);

        expect(dto).toMatchObject({
            id: 't1',
            tipoTreino: 'INTERVALADO',
            dataTreino: '2026-11-06',
            distanciaKm: 12.5,
            observacao: 'Segurar o ritmo no último tiro',
            descricao: 'Tiros de 1 km',
            zonaAlvo: 'Z4',
            percepcaoEsforcoEsperada: 7,
            tssPlanejado: 88,
            justificativaIa: 'Semana de pico',
        });
        expect(dto.diaSemana).toMatchObject({ value: 'QUINTA' });
    });

    it('etapas: enum objeto vira value; alvos, alvoPrimario, descrição e bloco preservados', () => {
        const etapas = toEditorTreino(LISTAGEM).etapas!;

        expect(etapas).toHaveLength(5);
        expect(etapas[0]).toEqual({
            ordem: 1, tipoEtapa: 'AQUECIMENTO', descricaoEtapa: 'Trote', duracaoMin: 15,
            fcAlvoEtapa: '120-140 bpm', alvoPrimario: 'FC',
        });
        expect(etapas[1]).toEqual({
            ordem: 2, tipoEtapa: 'INTERVALADO', descricaoEtapa: 'Tiro', duracaoMin: 4, distanciaKm: 1,
            ritmoAlvo: '4:00-4:10/km', alvoPrimario: 'PACE', blocoId: 'b1', blocoRepeticoes: 2,
        });
    });

    it.each([
        ['01:05:00', 'PT65M'],
        ['45:00', 'PT45M'],
        ['45:30', 'PT46M'],
        ['45:29', 'PT45M'],
        ['02:00:00', 'PT120M'],
    ])('duração %s vira %s (mesmo formato do toIso8601 do editor)', (texto, iso) => {
        expect(toEditorTreino({ ...LISTAGEM, duracaoMin: texto }).duracaoMin).toBe(iso);
    });

    it.each([['abc'], [''], ['00:00'], [undefined]])('duração inválida ou zero (%s) vira undefined', (texto) => {
        expect(toEditorTreino({ ...LISTAGEM, duracaoMin: texto }).duracaoMin).toBeUndefined();
    });

    it('bloco com blocoId vira série no editor', () => {
        const itens = itensFromEtapas(toEditorTreino(LISTAGEM).etapas);

        expect(itens).toHaveLength(2);
        expect(itens[1]).toMatchObject({ kind: 'block', repeticoes: '2' });
    });

    it('limitação herdada (itensFromEtapas): bloco com descrições diferentes por repetição fica com as da primeira janela', () => {
        const comDescricoesDiferentes = {
            ...LISTAGEM,
            etapas: LISTAGEM.etapas!.map((e, i) => (i === 3 ? { ...e, descricaoEtapa: 'Tiro forte' } : e)),
        };

        const itens = itensFromEtapas(toEditorTreino(comDescricoesDiferentes).etapas);
        const bloco = itens[1];

        expect(bloco.kind).toBe('block');
        expect(bloco.kind === 'block' && bloco.steps.map(s => s.descricaoEtapa)).toEqual(['Tiro', 'Trote leve']);
    });
});
