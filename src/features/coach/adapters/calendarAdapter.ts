import type { CoachCalendario } from '../../../types/Coach';
import { mapTipoTreino, type WorkoutType } from './workoutType';

/** Treino de um atleta no calendário (sem distância/duração — ausentes no DTO, A3). */
export interface CoachWorkout {
    date: string;
    type: WorkoutType;
    isKeyWorkout: boolean;
    hasAlert: boolean;
    hasPendingSuggestion: boolean;
}

/** Linha do calendário: um atleta e seus treinos da semana (sem phase/status — D6). */
export interface CoachCalendarRow {
    atletaId: string;
    nomeAtleta: string;
    workouts: CoachWorkout[];
}

/**
 * Agrupa os treinos planejados por atleta, formando as linhas do calendário,
 * ordenadas por nome. Treinos sem `atletaId` resolvido são ignorados (defensivo).
 */
export function groupCalendarByAtleta(calendario: CoachCalendario): CoachCalendarRow[] {
    const rows = new Map<string, CoachCalendarRow>();

    for (const t of calendario.treinos) {
        if (!t.atletaId) continue;
        let row = rows.get(t.atletaId);
        if (!row) {
            row = { atletaId: t.atletaId, nomeAtleta: t.nomeAtleta ?? '', workouts: [] };
            rows.set(t.atletaId, row);
        }
        row.workouts.push({
            date: t.data,
            type: mapTipoTreino(t.tipoTreino),
            isKeyWorkout: t.isKeyWorkout,
            hasAlert: t.hasAlert,
            hasPendingSuggestion: t.hasPendingSuggestion,
        });
    }

    return Array.from(rows.values()).sort((a, b) => a.nomeAtleta.localeCompare(b.nomeAtleta));
}
