import { describe, expect, it } from 'vitest';
import type { RestDayDto, TreinoPlanejadoDto } from '../../../types/PlanoReview';
import { mesclarPlanoPorDia } from './mesclarPlanoPorDia';

/**
 * show-descanso-no-plano, CA6: a lista do painel do treinador funde treinos e descansos, sempre
 * ordenada segunda→domingo — inclusive em plano sem descanso (CA2b).
 */
describe('mesclarPlanoPorDia', () => {
    const treino = (diaSemana: string, id = diaSemana): TreinoPlanejadoDto =>
        ({ id, diaSemana, tipoTreino: 'CONTINUO' } as unknown as TreinoPlanejadoDto);
    const descanso = (dayOfWeek: string, reason = 'motivo'): RestDayDto => ({ dayOfWeek, reason });

    const dias = (itens: ReturnType<typeof mesclarPlanoPorDia>) =>
        itens.map((i) => (i.kind === 'treino' ? `T:${i.dia}` : `D:${i.dia}`));

    it('ordena segunda→domingo, misturando treino e descanso', () => {
        const itens = mesclarPlanoPorDia(
            [treino('SABADO'), treino('TERCA')],
            [descanso('QUINTA'), descanso('SEGUNDA')],
        );

        expect(dias(itens)).toEqual(['D:SEGUNDA', 'T:TERCA', 'D:QUINTA', 'T:SABADO']);
    });

    it('CA2b: plano sem descanso também sai ordenado — é a mudança deliberada em plano antigo', () => {
        const itens = mesclarPlanoPorDia([treino('SEXTA'), treino('SEGUNDA')], []);

        expect(dias(itens)).toEqual(['T:SEGUNDA', 'T:SEXTA']);
    });

    it.each([[undefined], [null]])('trata restDays %s como ausência de descanso', (restDays) => {
        const itens = mesclarPlanoPorDia([treino('TERCA')], restDays as never);

        expect(dias(itens)).toEqual(['T:TERCA']);
    });

    it('dois treinos no mesmo dia aparecem os dois — o produto permite double-day', () => {
        const itens = mesclarPlanoPorDia([treino('TERCA', 'a'), treino('TERCA', 'b')], []);

        expect(itens).toHaveLength(2);
        expect(dias(itens)).toEqual(['T:TERCA', 'T:TERCA']);
    });

    it('dia com treino E descanso: o treino vence e o descanso não aparece', () => {
        const itens = mesclarPlanoPorDia([treino('QUINTA')], [descanso('QUINTA')]);

        expect(dias(itens)).toEqual(['T:QUINTA']);
    });

    it('descanso com dia inválido é ignorado, sem quebrar a lista', () => {
        const itens = mesclarPlanoPorDia([treino('TERCA')], [descanso('FUNDAY'), descanso('')]);

        expect(dias(itens)).toEqual(['T:TERCA']);
    });

    it('treino com dia desconhecido NÃO é descartado — vai para o fim', () => {
        const itens = mesclarPlanoPorDia([treino('FUNDAY'), treino('SEGUNDA')], []);

        expect(dias(itens)).toEqual(['T:SEGUNDA', 'T:FUNDAY']);
    });

    it('descanso duplicado no mesmo dia aparece uma vez só', () => {
        const itens = mesclarPlanoPorDia([], [descanso('QUINTA', 'a'), descanso('QUINTA', 'b')]);

        expect(dias(itens)).toEqual(['D:QUINTA']);
        expect(itens[0].kind === 'descanso' && itens[0].descanso.reason).toBe('a');
    });

    it('aceita dia em caixa e com espaços', () => {
        const itens = mesclarPlanoPorDia([treino(' terca ')], [descanso('  Segunda')]);

        expect(dias(itens)).toEqual(['D:SEGUNDA', 'T:TERCA']);
    });

    it('listas vazias dos dois lados devolvem lista vazia', () => {
        expect(mesclarPlanoPorDia([], [])).toEqual([]);
    });
});
