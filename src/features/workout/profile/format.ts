// Formatação de tudo que o perfil escreve na tela.

import type { BlockTarget } from './types';

export function formatDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)} s`;

  const minutos = Math.round(sec / 60);
  if (minutos < 60) return `${minutos} min`;

  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function mmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Proporção inteira reduzida — "trabalho 3:2", não "1.5".
 *
 * É como o treinador enuncia o treino. A leitura decimal o obriga a converter de
 * cabeça uma coisa que ele já sabe dizer, e a conversão acontece exatamente no
 * momento em que ele está decidindo se aprova.
 */
export function formatWorkRatio(razao: number | null): string | null {
  if (razao === null || !Number.isFinite(razao) || razao <= 0) return null;

  const [num, den] = fracaoAproximada(razao);
  return `trabalho ${num}:${den}`;
}

/** Menor fração de denominador pequeno que representa a razão — Stern-Brocot enxuto. */
function fracaoAproximada(valor: number, maxDenominador = 8): [number, number] {
  let melhor: [number, number] = [1, 1];
  let menorErro = Infinity;

  for (let den = 1; den <= maxDenominador; den++) {
    const num = Math.round(valor * den);
    if (num < 1) continue;
    const erro = Math.abs(valor - num / den);
    if (erro < menorErro - 1e-9) {
      menorErro = erro;
      melhor = [num, den];
    }
  }

  const d = mdc(melhor[0], melhor[1]);
  return [melhor[0] / d, melhor[1] / d];
}

function mdc(a: number, b: number): number {
  return b === 0 ? a : mdc(b, a % b);
}

/** O tooltip precisa de "88–94% FTP", "4:18–4:24 /km" e "RPE 7" — formatos diferentes. */
export function formatTarget(target: BlockTarget): string | null {
  switch (target.kind) {
    case 'ftpPct':
      return target.to ? `${target.from}–${target.to}% FTP` : `${target.from}% FTP`;
    case 'powerW':
      return target.to ? `${target.from}–${target.to} W` : `${target.from} W`;
    case 'hrPct': {
      const base = { max: 'FCmáx', reserve: 'FCR', threshold: 'FClimiar' }[target.basis];
      return target.to ? `${target.from}–${target.to}% ${base}` : `${target.from}% ${base}`;
    }
    case 'pace':
      return target.toSecPerKm
        ? `${mmss(target.fromSecPerKm)}–${mmss(target.toSecPerKm)} /km`
        : `${mmss(target.fromSecPerKm)} /km`;
    case 'pace100':
      return target.toSecPer100m
        ? `${mmss(target.fromSecPer100m)}–${mmss(target.toSecPer100m)} /100m`
        : `${mmss(target.fromSecPer100m)} /100m`;
    case 'rpe':
      return `RPE ${target.value}`;
    case 'none':
      return null;
  }
}
