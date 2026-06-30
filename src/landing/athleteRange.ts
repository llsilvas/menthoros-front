import type { FaixaAtletas } from "../types/Waitlist";

/** Mapeia o nº de atletas informado no form para a faixa do contrato da waitlist. */
export function faixaDeAtletas(n: number): FaixaAtletas {
  if (n <= 10) return "ATE_10";
  if (n <= 30) return "DE_11_A_30";
  if (n <= 100) return "DE_31_A_100";
  return "MAIS_DE_100";
}
