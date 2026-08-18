import { describe, it, expect } from 'vitest';
import { selectWorkoutProfile } from './selectWorkoutProfile';
import type { ProfileEtapaInput } from './input';
import type { ZoneKey } from './types';

// AC-6, verificação property-based sobre perfis gerados.
//
// Os casos tabelados do arquivo irmão cobrem as invariantes em treinos que EU
// escolhi — e a regressão que este critério existe para pegar (badge "Z1 100%"
// sobre blocos laranja) é exatamente do tipo que sobrevive a casos escolhidos a
// mão: ninguém escreve de propósito o treino que quebra a própria regra.
//
// Gerador próprio em vez de `fast-check`: sem dependência nova, e a seed fixa
// torna qualquer falha reproduzível na hora. O que se perde é o shrinking — o
// contraexemplo sai cru, não minimizado. Se a suíte começar a pegar falhas
// difíceis de ler, é o momento de reavaliar a biblioteca.

/** xorshift32: determinístico, suficiente para sortear forma de treino. */
function prng(seed: number): () => number {
  let x = seed || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;  x >>>= 0;
    return x / 0x100000000;
  };
}

const TIPOS = ['AQUECIMENTO', 'INTERVALADO', 'RECUPERACAO', 'PRINCIPAL', 'DESAQUECIMENTO', 'PAUSA', 'XPTO'];
const ZONAS: Array<ZoneKey | undefined> = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', undefined];

function treinoAleatorio(rnd: () => number): ProfileEtapaInput[] {
  const etapas: ProfileEtapaInput[] = [];
  const nItens = 1 + Math.floor(rnd() * 8);

  for (let i = 0; i < nItens; i++) {
    const tipo = TIPOS[Math.floor(rnd() * TIPOS.length)];
    const zona = ZONAS[Math.floor(rnd() * ZONAS.length)];
    // Inclui duração zero e ausente de propósito: o descarte de etapas sem
    // duração mexe no denominador da distribuição, e é onde a soma pode furar.
    const duracao = rnd() < 0.12 ? (rnd() < 0.5 ? 0 : undefined) : 1 + Math.floor(rnd() * 90);

    const ehSerie = rnd() < 0.3;
    if (ehSerie) {
      const reps = 2 + Math.floor(rnd() * 6);
      const grupo = `g${i}`;
      for (let r = 1; r <= reps; r++) {
        etapas.push({
          tipo, duracaoMin: duracao, fcAlvo: zona,
          blocoId: grupo, blocoRepeticoes: reps, blocoRepeticaoIndex: r,
        });
      }
    } else {
      etapas.push({ tipo, duracaoMin: duracao, fcAlvo: zona });
    }
  }

  return etapas;
}

describe('AC-6 (property-based) — badge e distribuição não conseguem divergir', () => {
  const SEED = 20260818;
  const N = 250;

  const perfis = Array.from({ length: N }, (_, i) =>
    selectWorkoutProfile(treinoAleatorio(prng(SEED + i)), { sport: 'run' }),
  );

  it(`gera ${N} perfis distintos, incluindo degradados e com descartes`, () => {
    expect(perfis).toHaveLength(N);
    expect(perfis.some((p) => p.degraded)).toBe(true);
    expect(perfis.some((p) => !p.degraded)).toBe(true);
    expect(perfis.some((p) => p.droppedBlocks > 0)).toBe(true);
    expect(perfis.some((p) => p.metrics.targetZone !== null)).toBe(true);
  });

  it('a distribuição soma 100% em todo perfil com blocos', () => {
    for (const [i, p] of perfis.entries()) {
      if (p.blocks.length === 0) continue;
      const soma = p.metrics.distribution.reduce((s, d) => s + d.share, 0);
      expect(Math.abs(soma - 1), `perfil ${i}: soma ${soma}`).toBeLessThanOrEqual(0.005);
    }
  });

  it('a zona da badge nunca está ausente da distribuição', () => {
    for (const [i, p] of perfis.entries()) {
      const alvo = p.metrics.targetZone;
      if (alvo === null) continue;
      const fatia = p.metrics.distribution.find((d) => d.zone === alvo);
      expect(fatia, `perfil ${i}: badge ${alvo} sem fatia na distribuição`).toBeDefined();
      expect(fatia!.share, `perfil ${i}: badge ${alvo} com ${(fatia!.share * 100).toFixed(1)}%`)
        .toBeGreaterThanOrEqual(0.15);
    }
  });

  it('nenhuma zona acima da badge tem share suficiente para ser o alvo', () => {
    const ordem: ZoneKey[] = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];
    for (const [i, p] of perfis.entries()) {
      const alvo = p.metrics.targetZone;
      if (alvo === null) continue;
      const acima = p.metrics.distribution.filter(
        (d) => ordem.indexOf(d.zone) > ordem.indexOf(alvo) && d.share >= 0.15,
      );
      expect(acima, `perfil ${i}: ${alvo} eleito com ${acima.map((d) => d.zone)} acima`).toHaveLength(0);
    }
  });

  it('o perfil degradado nunca exibe zona-alvo', () => {
    for (const [i, p] of perfis.entries()) {
      if (!p.degraded) continue;
      expect(p.metrics.targetZone, `perfil ${i} degradado com alvo`).toBeNull();
    }
  });

  it('a duração total é a soma dos blocos que sobraram, sempre', () => {
    for (const [i, p] of perfis.entries()) {
      const soma = p.blocks.reduce((s, b) => s + b.durationSec, 0);
      expect(p.metrics.totalDurationSec, `perfil ${i}`).toBe(soma);
    }
  });
});
