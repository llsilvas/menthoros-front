// Eixos do plot: marcas de tempo em X, faixas de zona em Y.

import type { IntensityScale, ZoneKey } from './types';

export interface AxisTick {
  /** Posição 0..1 ao longo do eixo. */
  ratio: number;
  label: string;
  /** O tick do total, que aparece mesmo fora do passo. */
  isTotal: boolean;
}

export interface ZoneBand {
  zone: ZoneKey;
  from: number;
  to: number;
  /** O rótulo vai aqui: a linha é o limite, o rótulo é a faixa. */
  center: number;
}

/** Passo "bonito" por duração, escolhido para render de 4 a 7 rótulos. */
function passoMinutos(totalMin: number): number {
  if (totalMin < 20) return 2;
  if (totalMin <= 45) return 5;
  if (totalMin <= 90) return 10;
  if (totalMin <= 180) return 15;
  return 30;
}

/**
 * Um treino, uma unidade na régua.
 *
 * Esta função devolvia minutos crus sempre que a hora era zero, mesmo num
 * treino longo — o eixo de 1h15 saía "0 10 20 30 40 50 1:00 1:10 1:15", e o
 * leitor trocava de sistema no meio. Acima de uma hora **tudo** vira `h:mm`,
 * inclusive o zero; abaixo, tudo segue em minutos, onde não há ambiguidade.
 */
function formatar(minutos: number, totalMin: number): string {
  if (totalMin <= 60) return String(minutos);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * Marcas do eixo X. O tick final é **sempre** a duração total, mesmo que fora do
 * passo: o treinador precisa do total exato, e ele some se ficar só na grade.
 */
export function xAxisTicks(totalDurationSec: number): AxisTick[] {
  if (totalDurationSec <= 0) return [];

  const totalMin = totalDurationSec / 60;
  const passo = passoMinutos(totalMin);

  const ticks: AxisTick[] = [];
  for (let m = 0; m < totalMin; m += passo) {
    ticks.push({ ratio: m / totalMin, label: formatar(m, totalMin), isTotal: false });
  }

  // Se o total cai perto demais do penúltimo, os dois rótulos colidem — e o que
  // sai é o do passo, porque o total é o que não pode faltar.
  //
  // A comparação é `<=`, e não `<`: num treino de 1h15 a distância é exatamente
  // meio passo (75 − 70 = 5), e com `<` os rótulos "1:10" e "1:15" saíam colados.
  const ultimo = ticks[ticks.length - 1];
  if (ultimo && totalMin - ultimo.ratio * totalMin <= passo / 2 && ticks.length > 1) {
    ticks.pop();
  }

  ticks.push({
    ratio: 1,
    label: formatar(Math.round(totalMin), totalMin),
    isTotal: true,
  });

  return ticks;
}

/** Faixas de zona no eixo Y, para gridline e rótulo. */
export function zoneBands(scale: IntensityScale): ZoneBand[] {
  const [a, b, c, d] = scale.zoneBreaks;
  const limites: Array<[ZoneKey, number, number]> = [
    ['Z1', 0, a],
    ['Z2', a, b],
    ['Z3', b, c],
    ['Z4', c, d],
    ['Z5', d, 1],
  ];
  return limites.map(([zone, from, to]) => ({ zone, from, to, center: (from + to) / 2 }));
}
