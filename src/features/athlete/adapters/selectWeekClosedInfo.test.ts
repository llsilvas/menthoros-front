import { describe, expect, it } from 'vitest';
import { selectWeekClosedInfo } from './selectWeekClosedInfo';
import type { PlanoSemanal, PlanoStatus } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';

const treino = (statusTreino: TreinoPlanejado['statusTreino']): TreinoPlanejado => ({
    tipoTreino: 'CORRIDA',
    distanciaKm: 10,
    diaSemana: 'SEGUNDA',
    statusTreino,
});

const plano = (status: PlanoSemanal['status'], treinos: TreinoPlanejado[]): PlanoSemanal => ({
    atletaId: 'a1',
    semanaInicio: '2026-06-29',
    semanaFim: '2026-07-05',
    volumePlanejadoKm: 40,
    volumeRealizadoKm: 20,
    volumeAlvoKm: 40,
    status,
    treinosPlanejados: treinos,
});

// Object-enum como chega do backend (@JsonFormat OBJECT).
const objEnum = (value: string) => ({ value, label: value }) as unknown as PlanoStatus;

describe('selectWeekClosedInfo', () => {
    it('conta os treinos PERDIDO quando a semana está CONCLUIDO (status string)', () => {
        const info = selectWeekClosedInfo(plano('CONCLUIDO', [
            treino('PERDIDO'), treino('PERDIDO'), treino('REALIZADO'),
        ]));
        expect(info.semanaEncerrada).toBe(true);
        expect(info.treinosPerdidos).toBe(2);
    });

    it('normaliza status e statusTreino como object-enum', () => {
        const info = selectWeekClosedInfo(plano(objEnum('CONCLUIDO'), [
            treino({ value: 'PERDIDO', label: 'Perdido' }),
            treino({ value: 'REALIZADO', label: 'Realizado' }),
            treino({ value: 'PERDIDO', label: 'Perdido' }),
        ]));
        expect(info.semanaEncerrada).toBe(true);
        expect(info.treinosPerdidos).toBe(2);
    });

    it('semanaEncerrada false quando o plano não está CONCLUIDO', () => {
        const info = selectWeekClosedInfo(plano('EM_ANDAMENTO', [treino('PERDIDO')]));
        expect(info.semanaEncerrada).toBe(false);
        expect(info.treinosPerdidos).toBe(1);
    });

    it('zero treinos perdidos quando não há PERDIDO', () => {
        const info = selectWeekClosedInfo(plano('CONCLUIDO', [treino('REALIZADO'), treino('PENDENTE')]));
        expect(info.treinosPerdidos).toBe(0);
    });

    it('plano null → sinal vazio', () => {
        expect(selectWeekClosedInfo(null)).toEqual({ semanaEncerrada: false, treinosPerdidos: 0 });
    });

    it('plano sem treinosPlanejados → zero', () => {
        const semTreinos = plano('CONCLUIDO', []);
        semTreinos.treinosPlanejados = undefined;
        expect(selectWeekClosedInfo(semTreinos).treinosPerdidos).toBe(0);
    });
});
