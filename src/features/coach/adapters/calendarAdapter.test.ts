import { describe, expect, it } from 'vitest';
import { groupCalendarByAtleta } from './calendarAdapter';
import type { CoachCalendario, TreinoAgendado } from '../../../types/Coach';

function treino(over: Partial<TreinoAgendado>): TreinoAgendado {
    return {
        atletaId: '1',
        nomeAtleta: 'Ana',
        data: '2026-06-15',
        tipoTreino: 'FACIL',
        isKeyWorkout: false,
        hasAlert: false,
        hasPendingSuggestion: false,
        ...over,
    };
}

function calendario(treinos: TreinoAgendado[]): CoachCalendario {
    return { semanaInicio: '2026-06-15', semanaFim: '2026-06-21', treinos };
}

describe('groupCalendarByAtleta', () => {
    it('agrupa treinos por atleta e mapeia o tipo', () => {
        const rows = groupCalendarByAtleta(
            calendario([
                treino({ atletaId: '1', nomeAtleta: 'Ana', data: '2026-06-15', tipoTreino: 'INTERVALADO' }),
                treino({ atletaId: '1', nomeAtleta: 'Ana', data: '2026-06-17', tipoTreino: 'LONGO' }),
            ]),
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].atletaId).toBe('1');
        expect(rows[0].workouts).toHaveLength(2);
        expect(rows[0].workouts.map((w) => w.type)).toEqual(['intervals', 'long_run']);
    });

    it('ordena as linhas por nome do atleta', () => {
        const rows = groupCalendarByAtleta(
            calendario([
                treino({ atletaId: '2', nomeAtleta: 'Bia' }),
                treino({ atletaId: '1', nomeAtleta: 'Ana' }),
            ]),
        );
        expect(rows.map((r) => r.nomeAtleta)).toEqual(['Ana', 'Bia']);
    });

    it('ignora treinos sem atletaId resolvido', () => {
        const rows = groupCalendarByAtleta(
            calendario([treino({ atletaId: undefined, nomeAtleta: undefined })]),
        );
        expect(rows).toHaveLength(0);
    });

    it('preserva as flags do treino', () => {
        const rows = groupCalendarByAtleta(
            calendario([treino({ isKeyWorkout: true, hasAlert: true, hasPendingSuggestion: true })]),
        );
        expect(rows[0].workouts[0]).toMatchObject({
            isKeyWorkout: true,
            hasAlert: true,
            hasPendingSuggestion: true,
        });
    });

    it('semana vazia → nenhuma linha', () => {
        expect(groupCalendarByAtleta(calendario([]))).toEqual([]);
    });
});
