import { format } from 'date-fns';

/**
 * Datas e dias da semana de um plano. Mora em `utils` porque as duas features precisam das mesmas
 * contas: a agenda do atleta monta os 7 dias e o painel do treinador deriva a data de um dia de
 * descanso (show-descanso-no-plano). `weekDatesFromInicio` veio de
 * `features/athlete/adapters/buildWeekAgenda.ts` — `features/coach` não deve importar de
 * `features/athlete`.
 */

/** Ordem canônica da semana. Fonte única: um typo aqui não quebra build, só desalinha as telas. */
export const ORDEM_DIAS = [
  'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO',
] as const;

export type DiaDaSemana = (typeof ORDEM_DIAS)[number];

/** Índice na semana (0 = segunda), ou `-1` quando o dia não é reconhecido. */
export function indiceDoDia(dia: string | null | undefined): number {
  if (!dia) return -1;
  return ORDEM_DIAS.indexOf(dia.trim().toUpperCase() as DiaDaSemana);
}

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

/**
 * Data ISO do dia da semana dentro da semana do plano — é assim que o backend escolhe o dia de um
 * treino. Dia desconhecido cai na segunda, para nunca devolver data inválida.
 */
export function isoDoDiaNaSemana(datasDaSemana: Date[], dia: string): string {
  const i = indiceDoDia(dia);
  return format(datasDaSemana[i] ?? datasDaSemana[0], 'yyyy-MM-dd');
}
