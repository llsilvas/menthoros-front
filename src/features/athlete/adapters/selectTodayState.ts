// Estado do dia no hero da Home (design.md D1, athlete-training-loop) — máquina de estados pura.
//
// "Hoje" é sempre `home.hoje` (fuso do atleta, resolvido pelo backend), nunca a data do
// aparelho. Feito vence planejado: um treino registrado hoje é o eixo primário do dia, mesmo
// que ainda exista um planejado pendente na mesma data.

import type { AthleteHome } from '../../../types/AthleteHome';

export type TodayState = 'PLANEJADO' | 'FEITO_SEM_FEEDBACK' | 'FEITO' | 'PULADO' | 'DESCANSO';

export function selectTodayState(home: AthleteHome | null | undefined): TodayState {
  const hoje = home?.hoje;
  if (!hoje) return 'DESCANSO';

  const realizado = home?.realizadoHoje;
  if (realizado) {
    // Completude é o carimbo — nunca a presença de um RPE legado sem feedbackRegistradoEm (D3).
    return realizado.feedbackRegistradoEm ? 'FEITO' : 'FEITO_SEM_FEEDBACK';
  }

  const planejado = home?.proximoTreino;
  if (planejado?.data === hoje) {
    return planejado.statusTreino === 'PERDIDO' ? 'PULADO' : 'PLANEJADO';
  }

  return 'DESCANSO';
}
