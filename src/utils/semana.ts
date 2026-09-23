/**
 * Datas da semana de um plano. Mora em `utils` porque as duas features precisam da mesma conta: a
 * agenda do atleta monta os 7 dias e o painel do treinador deriva a data de um dia de descanso
 * (show-descanso-no-plano, task 1.3). Antes vivia em `features/athlete/adapters/buildWeekAgenda.ts`,
 * e `features/coach` não deve importar de `features/athlete`.
 */

/** 7 dias (segunda→domingo) a partir do `semanaInicio` do plano, em horário local. */
export function weekDatesFromInicio(semanaInicio: string): Date[] {
  const [y, m, d] = semanaInicio.split('-').map(Number);
  const inicio = new Date(y, m - 1, d);
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + i);
    return dia;
  });
}
