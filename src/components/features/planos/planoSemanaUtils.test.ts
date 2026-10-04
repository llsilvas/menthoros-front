import { describe, expect, it } from 'vitest';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import {
    calcularVolumeRealizado,
    formatarDataCurta,
    formatarDiaCurto,
    formatarKm,
    formatarPeriodo,
    formatarPeriodoCurto,
    ordenarPorDiaSemana,
    ordenarPlanosPorSemana,
    planoKey,
    rotuloTipoTreino,
} from './planoSemanaUtils';

const treino = (over: Partial<TreinoPlanejado>): TreinoPlanejado =>
    ({ tipoTreino: 'CONTINUO', distanciaKm: 5, diaSemana: 'SEGUNDA', ...over }) as TreinoPlanejado;

describe('planoSemanaUtils — datas', () => {
    it('não recua um dia: data ISO sem hora é lida como data local', () => {
        expect(formatarPeriodo('2026-09-28', '2026-10-04')).toBe('28/09/2026 – 04/10/2026');
        expect(formatarPeriodoCurto('2026-09-28', '2026-10-04')).toBe('28/09 – 04/10');
        expect(formatarDataCurta('2026-09-29')).toBe('29/09');
    });

    it('valor que não é data volta como veio, em vez de "Invalid Date"', () => {
        expect(formatarDataCurta('sem data')).toBe('sem data');
    });
});

describe('planoSemanaUtils — dias e tipos', () => {
    it('abrevia o dia sem acento e em caixa alta', () => {
        expect(formatarDiaCurto('Terça-feira')).toBe('TER');
        expect(formatarDiaCurto('SABADO')).toBe('SAB');
        expect(formatarDiaCurto('domingo')).toBe('DOM');
    });

    it('rotula o tipo em PT-BR e não devolve o código cru para tipo desconhecido', () => {
        expect(rotuloTipoTreino('CONTINUO')).toBe('Contínuo');
        expect(rotuloTipoTreino('regenerativo')).toBe('Regenerativo');
        expect(rotuloTipoTreino('HILL_REPEAT')).toBe('Hill repeat');
    });

    it('ordena os treinos de segunda a domingo, aceitando string e objeto de enum', () => {
        const ordenados = ordenarPorDiaSemana([
            treino({ id: 'dom', diaSemana: 'DOMINGO' }),
            treino({ id: 'qua', diaSemana: { value: 'QUARTA', label: 'Quarta-feira' } }),
            treino({ id: 'seg', diaSemana: 'Segunda-feira' }),
        ]);
        expect(ordenados.map((t) => t.id)).toEqual(['seg', 'qua', 'dom']);
    });
});

describe('planoSemanaUtils — volume', () => {
    it('soma só os treinos realizados (por status ou pela flag legada)', () => {
        const total = calcularVolumeRealizado([
            treino({ distanciaKm: 8, statusTreino: 'REALIZADO' }),
            treino({ distanciaKm: 7, statusTreino: { value: 'REALIZADO', label: 'Realizado' } }),
            treino({ distanciaKm: 4, realizado: true }),
            treino({ distanciaKm: 5, statusTreino: 'PERDIDO' }),
            treino({ distanciaKm: 16, statusTreino: 'PLANEJADO' }),
        ]);
        expect(total).toBe(19);
    });

    it('formata km em pt-BR com no máximo uma casa', () => {
        expect(formatarKm(42)).toBe('42 km');
        expect(formatarKm(15.25)).toBe('15,3 km');
    });
});

describe('planoSemanaUtils — chave do plano', () => {
    it('usa o id e cai no índice quando o plano não tem id', () => {
        expect(planoKey({ id: 'p1' } as never, 3)).toBe('p1');
        expect(planoKey({} as never, 3)).toBe('plano-3');
    });
});

describe('planoSemanaUtils — semanas', () => {
    const plano = (id: string, semanaInicio: string, status: string): PlanoSemanal =>
        ({ id, semanaInicio, status }) as PlanoSemanal;

    it('ordena da semana mais recente para a mais antiga, misturando atual e concluídas', () => {
        const ordenados = ordenarPlanosPorSemana([
            plano('c1', '2026-09-14', 'CONCLUIDO'),
            plano('a1', '2026-09-28', 'ATIVO'),
            plano('c2', '2026-09-21', 'CONCLUIDO'),
        ]);
        expect(ordenados.map((p) => p.id)).toEqual(['a1', 'c2', 'c1']);
    });

    it('aceita o status como objeto de enum e não altera a lista original', () => {
        const original = [
            { id: 'x', semanaInicio: '2026-09-21', status: { value: 'CONCLUIDO', label: 'Concluído' } },
            plano('y', '2026-09-28', 'ATIVO'),
        ] as unknown as PlanoSemanal[];
        expect(ordenarPlanosPorSemana(original).map((p) => p.id)).toEqual(['y', 'x']);
        expect(original.map((p) => p.id)).toEqual(['x', 'y']);
    });
});
