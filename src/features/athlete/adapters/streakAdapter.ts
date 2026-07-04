import { isSameWeek, parseISO, subWeeks } from 'date-fns';

interface TreinoComData {
  dataTreino: string; // ISO date
}

/**
 * Streak de semanas consistentes (≥1 treino) terminando na semana atual ou anterior.
 *
 * Semana ISO (segunda a domingo). Se a semana atual ainda não tem treino registrado, a contagem
 * começa pela semana anterior — dá benefício da dúvida à semana em andamento (ainda pode virar
 * consistente até domingo), evitando quebrar o streak precocemente. Ao encontrar a primeira
 * semana sem treino, para de contar (não pula lacunas).
 */
export function calcularStreakSemanas(treinos: TreinoComData[], hoje: Date = new Date()): number {
  const datas = treinos.map((t) => parseISO(t.dataTreino));

  function semanaTemTreino(semanaRef: Date): boolean {
    return datas.some((d) => isSameWeek(d, semanaRef, { weekStartsOn: 1 }));
  }

  let cursor = hoje;
  if (!semanaTemTreino(cursor)) {
    cursor = subWeeks(cursor, 1);
  }

  let streak = 0;
  while (semanaTemTreino(cursor)) {
    streak += 1;
    cursor = subWeeks(cursor, 1);
  }

  return streak;
}
