import type { CheckinProntidaoInput, CheckinProntidaoOutput } from '../../../types/Checkin';

/** Os cinco sinais do `CheckinProntidaoInputDto`, na ordem em que aparecem na Home. */
export type CheckinItemKey = 'qualidadeSono' | 'humor' | 'doresMusculares' | 'nivelEnergia' | 'estresse';

/** 1 = pior, 2 = médio, 3 = melhor — sempre na leitura do atleta, independente da escala do DTO. */
export type NivelInline = 1 | 2 | 3;

export type SelecaoInline = Record<CheckinItemKey, NivelInline | null>;

export interface CheckinItemDef {
  key: CheckinItemKey;
  label: string;
  /** Rótulo curto por nível (1, 2, 3). */
  niveis: readonly [string, string, string];
  /** Dores e estresse: valor maior no DTO = pior. */
  invertido: boolean;
}

export const CHECKIN_ITENS: readonly CheckinItemDef[] = [
  { key: 'qualidadeSono', label: 'Sono', niveis: ['ruim', 'ok', 'bom'], invertido: false },
  { key: 'humor', label: 'Humor', niveis: ['baixo', 'ok', 'bom'], invertido: false },
  { key: 'doresMusculares', label: 'Dores', niveis: ['fortes', 'leves', 'nenhuma'], invertido: true },
  { key: 'nivelEnergia', label: 'Energia', niveis: ['baixa', 'ok', 'alta'], invertido: false },
  { key: 'estresse', label: 'Estresse', niveis: ['alto', 'médio', 'baixo'], invertido: true },
] as const;

const POR_KEY = Object.fromEntries(CHECKIN_ITENS.map((i) => [i.key, i])) as Record<CheckinItemKey, CheckinItemDef>;

// O ReadinessService normaliza linearmente (positivos 1–10, invertidos 0–10) com cortes em 0,75 e
// 0,50; três pontos por sinal caem limpos nas três bandas (task 0.1). Dores/estresse ficam em
// 8/4/0 porque a escala deles começa em 0.
const VALOR_POSITIVO: Record<NivelInline, number> = { 1: 3, 2: 6, 3: 9 };
const VALOR_INVERTIDO: Record<NivelInline, number> = { 1: 8, 2: 4, 3: 0 };

export function nivelParaValor(key: CheckinItemKey, nivel: NivelInline): number {
  return POR_KEY[key].invertido ? VALOR_INVERTIDO[nivel] : VALOR_POSITIVO[nivel];
}

// Positivos: ≤4 / 5–7 / ≥8. Invertidos: ≤3 / 4–7 / ≥8 — o meio (4) precisa voltar como nível 2.
export function valorParaNivel(key: CheckinItemKey, valor: number): NivelInline {
  if (POR_KEY[key].invertido) return valor >= 8 ? 1 : valor <= 3 ? 3 : 2;
  return valor >= 8 ? 3 : valor <= 4 ? 1 : 2;
}

export const SELECAO_VAZIA: SelecaoInline = {
  qualidadeSono: null, humor: null, doresMusculares: null, nivelEnergia: null, estresse: null,
};

/** `null` enquanto faltar item: os cinco campos são `@NotNull` no backend — nunca inventar valor. */
export function selecaoParaInput(selecao: SelecaoInline): CheckinProntidaoInput | null {
  const entradas = CHECKIN_ITENS.map((i) => [i.key, selecao[i.key]] as const);
  if (entradas.some(([, n]) => n === null)) return null;
  return Object.fromEntries(entradas.map(([k, n]) => [k, nivelParaValor(k, n as NivelInline)])) as unknown as CheckinProntidaoInput;
}

export function selecaoDeCheckin(c: Pick<CheckinProntidaoOutput, CheckinItemKey>): SelecaoInline {
  return Object.fromEntries(CHECKIN_ITENS.map((i) => [i.key, valorParaNivel(i.key, c[i.key])])) as SelecaoInline;
}

export function pendentes(selecao: SelecaoInline): number {
  return CHECKIN_ITENS.filter((i) => selecao[i.key] === null).length;
}
