// Seletor puro: etapas → WorkoutProfile. Sem React, sem estado, sem I/O.
//
// É a correção estrutural do defeito que motivou a change: badge de zona-alvo,
// legenda de distribuição e cor de preenchimento saíam de três derivações
// independentes, e nada as obrigava a concordar — daí a badge "Z1 100%" sobre
// blocos laranja. Aqui tudo sai do mesmo retorno da mesma chamada, e não há como
// divergirem sem que um teste desta suíte quebre.

import type {
  BlockKind,
  IntensityConfidence,
  IntensityScale,
  KindShare,
  ProfileBlock,
  ProfileMetrics,
  RampSpec,
  Sport,
  WorkoutProfile,
  ZoneKey,
  ZoneShare,
} from './types';
import type { ProfileEtapaInput } from './input';
import { midpointOf, scaleFor, zoneOf, type AthleteThresholds } from './scale';

export interface ProfileContext {
  sport: Sport;
  thresholds?: AthleteThresholds;
  tss?: number | null;
  if?: number | null;
}

const ZONAS: ZoneKey[] = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];

/** Zona-alvo precisa de pelo menos 15% do tempo — abaixo disso é pico incidental. */
const SHARE_MINIMO_ALVO = 0.15;

/**
 * Alturas do modo degradado (spec §6.4). Três níveis discretos e declarados,
 * porque codificar uma intensidade contínua que não temos seria desenhar uma
 * precisão inexistente.
 */
const ALTURA_POR_PAPEL: Record<BlockKind, number> = {
  rest:     0.25,
  recovery: 0.25,
  warmup:   0.50,
  cooldown: 0.50,
  steady:   0.50,
  work:     0.85,
};

/** Abreviações declaradas, nunca `slice(0, 5)` — "AQUEC" cortado é ambíguo com "DESAQ". */
const ABREVIACAO: Record<BlockKind, string> = {
  warmup:   'AQUEC',
  cooldown: 'DESAQ',
  recovery: 'REC',
  rest:     'PAUSA',
  work:     'TRAB',
  steady:   'BASE',
};

const NOME_DO_PAPEL: Record<BlockKind, string> = {
  warmup:   'Aquecimento',
  cooldown: 'Desaquecimento',
  recovery: 'Recuperação',
  rest:     'Pausa',
  work:     'Bloco de trabalho',
  steady:   'Bloco contínuo',
};

function papelDe(tipo: string): BlockKind {
  const t = (tipo ?? '').toLowerCase();
  // "desaquecimento" contém "aquecimento": a ordem aqui não é estilo, é correção.
  if (t.includes('desaquecimento') || t.includes('cooldown') || t.includes('cool_down')) return 'cooldown';
  if (t.includes('aquecimento') || t.includes('warmup') || t.includes('warm_up')) return 'warmup';
  if (t.includes('recuperacao') || t.includes('recuperação') || t.includes('recovery')) return 'recovery';
  if (t.includes('pausa') || t.includes('descanso') || t.includes('rest')) return 'rest';
  if (t.includes('intervalado') || t.includes('interval') || t.includes('tiro') || t.includes('esforco') || t.includes('esforço')) return 'work';
  if (t.includes('principal') || t.includes('continuo') || t.includes('contínuo') || t.includes('base') || t.includes('longo')) return 'steady';
  return 'steady';
}

/**
 * Zona declarada explicitamente no alvo da etapa: "Z4", "zona 4".
 *
 * Vale como `prescribed` (ver `IntensityConfidence`): alguém escreveu aquela
 * zona, então ela é dado, não palpite. O que continua estimado é a altura
 * dentro da faixa — e é por isso que a spec chama o teto de escala de fixo.
 */
function zonaDeclarada(...textos: Array<string | undefined>): ZoneKey | null {
  for (const texto of textos) {
    if (!texto) continue;
    const m = texto.toLowerCase().match(/z(?:ona\s*)?([1-5])\b/);
    if (m) return `Z${m[1]}` as ZoneKey;
  }
  return null;
}

/**
 * Zona inferida de prosa. É a heurística que já existia no `toWorkoutBlocks` —
 * ela não some antes de o backend expor intensidade estruturada, mas passa a ser
 * **declarada como estimativa** (`confidence: 'derived'`) em vez de apresentada
 * como fato. Devolve `null` quando não sabe, e é isso que a diferencia da
 * versão anterior, que devolvia Z1 e mentia em silêncio.
 */
function zonaInferida(tipo: string, ...textos: Array<string | undefined>): ZoneKey | null {
  const t = [tipo, ...textos].filter(Boolean).join(' ').toLowerCase();
  if (!t.trim()) return null;

  if (t.includes('vo2') || t.includes('sprint') || t.includes('máxim') || t.includes('maxim')) return 'Z5';
  if (t.includes('limiar') || t.includes('threshold')) return 'Z4';
  if (t.includes('tempo') || t.includes('moderado')) return 'Z3';

  const papel = papelDe(tipo);
  if (papel === 'warmup' || papel === 'cooldown' || papel === 'recovery' || papel === 'rest') return 'Z1';
  if (t.includes('aerob') || t.includes('leve') || t.includes('easy') || t.includes('longo')) return 'Z2';
  if (papel === 'work') return 'Z4';

  return null;
}

interface BlocoResolvido {
  zone: ZoneKey | null;
  confidence: IntensityConfidence;
}

function resolverZona(e: ProfileEtapaInput): BlocoResolvido {
  const declarada = zonaDeclarada(e.fcAlvo, e.intensidade);
  if (declarada) return { zone: declarada, confidence: 'prescribed' };

  const inferida = zonaInferida(e.tipo, e.descricao, e.intensidade, e.ritmoAlvo);
  if (inferida) return { zone: inferida, confidence: 'derived' };

  return { zone: null, confidence: 'unknown' };
}

function construirBlocos(
  etapas: ProfileEtapaInput[],
  resolvidas: BlocoResolvido[],
  scale: IntensityScale,
  degraded: boolean,
): ProfileBlock[] {
  const blocos: ProfileBlock[] = [];

  for (const [i, e] of etapas.entries()) {
    const minutos = e.duracaoMin;
    if (!minutos || minutos <= 0) continue;

    const papel = papelDe(e.tipo);
    const { zone, confidence } = resolvidas[i];
    const order = blocos.length;

    // No modo degradado a altura codifica o papel; fora dele, o ponto médio da
    // faixa da zona. Zona desconhecida fica no meio da escala, hachurada pelo
    // componente — escolher Z1 seria afirmar que o trecho é leve.
    const intensityNormalized = degraded
      ? ALTURA_POR_PAPEL[papel]
      : zone
        ? midpointOf(zone, scale)
        : 0.45;

    const rampa = rampaDe(papel, intensityNormalized);

    blocos.push({
      id:    e.id ?? `etapa-${order}`,
      order,
      kind:  papel,
      durationSec: Math.round(minutos * 60),
      label: e.descricao?.trim() || e.tipo?.trim() || NOME_DO_PAPEL[papel],
      shortLabel: ABREVIACAO[papel],
      target: { kind: 'none' },
      intensityNormalized,
      zone: zone ?? zoneOf(intensityNormalized, scale),
      confidence,
      ...(rampa ? { ramp: rampa } : {}),
      ...(e.blocoId && e.blocoRepeticoes && e.blocoRepeticoes > 1
        ? {
            repeat: {
              groupId: e.blocoId,
              index:   e.blocoRepeticaoIndex ?? 1,
              total:   e.blocoRepeticoes,
            },
          }
        : {}),
      ...(e.observacao ? { note: e.observacao } : {}),
    });
  }

  return blocos;
}

/** Quanto a rampa se abre para cada lado do valor nominal. */
const ABERTURA_RAMPA = 0.33;

/**
 * Aquecimento e desaquecimento são trajetórias, não patamares — e é a **forma**
 * que passa a comunicar o papel estrutural, agora que a cor pertence à zona.
 * A altura nominal continua sendo o ponto médio; a rampa só governa a geometria.
 */
function rampaDe(papel: BlockKind, nominal: number): RampSpec | null {
  if (papel !== 'warmup' && papel !== 'cooldown') return null;

  const piso = Math.max(0.12, nominal * (1 - ABERTURA_RAMPA));
  const teto = Math.min(1, nominal * (1 + ABERTURA_RAMPA));

  return papel === 'warmup'
    ? { fromNormalized: piso, toNormalized: teto }
    : { fromNormalized: teto, toNormalized: piso };
}

function distribuirPorZona(blocos: ProfileBlock[], total: number): ZoneShare[] {
  if (total <= 0) return [];
  const segundos = new Map<ZoneKey, number>();
  for (const b of blocos) segundos.set(b.zone, (segundos.get(b.zone) ?? 0) + b.durationSec);

  return ZONAS.filter((z) => segundos.has(z)).map((zone) => ({
    zone,
    seconds: segundos.get(zone)!,
    share:   segundos.get(zone)! / total,
  }));
}

function distribuirPorPapel(blocos: ProfileBlock[], total: number): KindShare[] {
  if (total <= 0) return [];
  const segundos = new Map<BlockKind, number>();
  for (const b of blocos) segundos.set(b.kind, (segundos.get(b.kind) ?? 0) + b.durationSec);

  return [...segundos.entries()].map(([kind, seconds]) => ({ kind, seconds, share: seconds / total }));
}

/** Z3+ é o piso do que conta como trabalho de verdade nas métricas de esforço. */
function zonaIntensa(zone: ZoneKey): boolean {
  return ZONAS.indexOf(zone) >= ZONAS.indexOf('Z3');
}

/** Maior sequência contígua em Z3 ou acima — "quanto de trabalho real tem aqui". */
function maiorBlocoDeTrabalho(blocos: ProfileBlock[]): number {
  let maior = 0;
  let corrente = 0;
  for (const b of blocos) {
    corrente = zonaIntensa(b.zone) ? corrente + b.durationSec : 0;
    if (corrente > maior) maior = corrente;
  }
  return maior;
}

/**
 * Razão trabalho:recuperação. Dentro das séries quando existe pelo menos uma —
 * é como o treinador enuncia o treino ("3 por 2"), e é a leitura que muda a
 * decisão. A razão global de um longo com sprint final não diz nada.
 */
function razaoTrabalhoRecuperacao(blocos: ProfileBlock[]): number | null {
  const naSerie = blocos.filter((b) => b.repeat);
  const dentroDaSerie = naSerie.length > 0;
  const escopo = dentroDaSerie ? naSerie : blocos;

  const ehTrabalho = (b: ProfileBlock) => (dentroDaSerie ? b.kind === 'work' : zonaIntensa(b.zone));
  const ehDescanso = (b: ProfileBlock) =>
    dentroDaSerie ? b.kind === 'recovery' || b.kind === 'rest' : !zonaIntensa(b.zone);

  const trabalho = escopo.filter(ehTrabalho).reduce((s, b) => s + b.durationSec, 0);
  const recuperacao = escopo.filter(ehDescanso).reduce((s, b) => s + b.durationSec, 0);

  if (recuperacao === 0 || trabalho === 0) return null;
  return trabalho / recuperacao;
}

function elegerZonaAlvo(distribution: ZoneShare[]): ZoneShare | null {
  const candidatas = distribution.filter((d) => d.share >= SHARE_MINIMO_ALVO);
  if (candidatas.length === 0) return null;
  return candidatas.reduce((maior, d) => (ZONAS.indexOf(d.zone) > ZONAS.indexOf(maior.zone) ? d : maior));
}

export function selectWorkoutProfile(
  etapas: ProfileEtapaInput[],
  context: ProfileContext,
): WorkoutProfile {
  const scale = scaleFor(context.sport, context.thresholds);

  const utilizaveis = etapas.filter((e) => (e.duracaoMin ?? 0) > 0);
  const droppedBlocks = etapas.length - utilizaveis.length;

  // Degradado = alguma etapa sem zona confiável. Enquanto o backend não expuser
  // intensidade estruturada (DEP-1), o caminho normal é este — e o header diz
  // isso ao treinador, em vez de deixá-lo ler estimativa como medição.
  // Resolvidas uma vez: a heurística é string matching por etapa, e chamá-la de
  // novo dentro da construção dos blocos repetiria o mesmo trabalho.
  const resolvidas = utilizaveis.map(resolverZona);
  const degraded = utilizaveis.length > 0
    && resolvidas.some((r) => r.confidence !== 'prescribed');

  const blocks = construirBlocos(utilizaveis, resolvidas, scale, degraded);
  const totalDurationSec = blocks.reduce((s, b) => s + b.durationSec, 0);

  const distribution = distribuirPorZona(blocks, totalDurationSec);
  // Sem zona confiável, uma distribuição "por zona" seria um gráfico de
  // suposições com aparência de medida. No degradado ela é por papel.
  const alvo = degraded ? null : elegerZonaAlvo(distribution);

  const metrics: ProfileMetrics = {
    totalDurationSec,
    blockCount: blocks.length,
    targetZone: alvo?.zone ?? null,
    targetZoneSeconds: alvo?.seconds ?? 0,
    distribution,
    ...(degraded ? { kindDistribution: distribuirPorPapel(blocks, totalDurationSec) } : {}),
    longestWorkBlockSec: maiorBlocoDeTrabalho(blocks),
    workToRecoveryRatio: razaoTrabalhoRecuperacao(blocks),
    intensityFactor: context.if ?? null,
    tss: context.tss ?? null,
  };

  return { sport: context.sport, scale, blocks, metrics, degraded, droppedBlocks };
}
