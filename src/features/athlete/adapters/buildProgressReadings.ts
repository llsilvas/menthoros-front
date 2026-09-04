import { differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';
import type { PmcPontoRaw } from '../../../types/AtletaPerfilCoach';
import type { AthleteAderencia, AthleteRecord, AthleteZones } from '../../../types/AthleteProgress';
import { FAIXA_APRESENTACAO, type FaixaApresentacao } from '../../../types/FaixaTsb';
import type { Prova } from '../../../types/Prova';
import { buildZoneDistributionPercent, type ZoneDistributionPercent } from './zonesAdapter';
import { buildRecordRows, type RecordRow } from './recordsAdapter';
import { buildProximaProva, type ProximaProva } from './provasAdapter';

// As quatro leituras do Progresso vivem juntas de propósito: dividem os limiares abaixo (únicos
// números novos da change, validados com o founder — task 0.2) e a página as consome em bloco. A UI
// descreve; quem interpreta é o coach, então só existe um corte: o que conta como "estável".
export const CTL_DELTA_ESTAVEL = 3;
export const CTL_JANELA_DIAS = 28;
export const CTL_TOLERANCIA_DIAS = 3;
export const CTL_SPARKLINE_DIAS = 84;
export const RECORDE_NOVO_DIAS = 28;
export const ADERENCIA_SEMANAS = 4;

export type CtlTendencia = 'subiu' | 'estavel' | 'caiu';

export interface StrongerReading {
  /** `null` quando não há ponto de referência na janela — "Ainda cedo para comparar". */
  delta: number | null;
  tendencia: CtlTendencia | null;
  ctlHoje: number;
  /** Só a leitura em palavras do backend (`FaixaTsb`); sem régua paralela de cansaço. */
  forma: FaixaApresentacao | null;
  /** CTL dos últimos 84 dias, na ordem, para a sparkline. */
  sparkline: number[];
}

export interface ZonesReading {
  percentuais: ZoneDistributionPercent;
  dominante: keyof ZoneDistributionPercent;
  totalSegundos: number;
}

export interface AdherenceWeek {
  semanaInicio: string;
  planejado: number;
  realizado: number;
  semPlano: boolean;
  corrente: boolean;
}

export interface AdherenceReading {
  realizado: number;
  planejado: number;
  percentual: number;
  /** Sempre 4. */
  semanas: AdherenceWeek[];
}

export interface RecordsReading {
  rows: Array<RecordRow & { novo: boolean }>;
  proximaProva: ProximaProva | null;
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

/** Ponto do PMC mais próximo de `alvo` dentro de ±`CTL_TOLERANCIA_DIAS`: a série é diária, mas só tem dias com métrica. */
function pontoProximo(pmc: PmcPontoRaw[], alvo: Date): PmcPontoRaw | null {
  let melhor: PmcPontoRaw | null = null;
  let melhorDist = Number.POSITIVE_INFINITY;
  for (const p of pmc) {
    const dist = Math.abs(differenceInCalendarDays(parseISO(p.data), alvo));
    if (dist <= CTL_TOLERANCIA_DIAS && dist < melhorDist) { melhor = p; melhorDist = dist; }
  }
  return melhor;
}

export function buildStrongerReading(pmc: PmcPontoRaw[], hoje: Date = new Date()): StrongerReading | null {
  if (pmc.length === 0) return null;
  const ordenado = [...pmc].sort((a, b) => a.data.localeCompare(b.data));
  const ultimo = ordenado[ordenado.length - 1];
  const base = pontoProximo(ordenado, new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - CTL_JANELA_DIAS));
  // O limiar compara o Δ bruto: arredondar antes faria 2,6 virar 3 e "subir" quando o design diz estável (|Δ| < 3).
  const deltaBruto = base ? ultimo.ctl - base.ctl : null;
  const delta = deltaBruto === null ? null : Math.round(deltaBruto);
  const tendencia: CtlTendencia | null = deltaBruto === null ? null : Math.abs(deltaBruto) < CTL_DELTA_ESTAVEL ? 'estavel' : deltaBruto > 0 ? 'subiu' : 'caiu';
  const inicioSparkline = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - CTL_SPARKLINE_DIAS);
  return {
    delta,
    tendencia,
    ctlHoje: Math.round(ultimo.ctl),
    forma: ultimo.statusForma && FAIXA_APRESENTACAO[ultimo.statusForma] ? FAIXA_APRESENTACAO[ultimo.statusForma] : null,
    sparkline: ordenado.filter((p) => parseISO(p.data) >= inicioSparkline).map((p) => p.ctl),
  };
}

export function buildZonesReading(zones: AthleteZones | null): ZonesReading | null {
  if (!zones) return null;
  const percentuais = buildZoneDistributionPercent(zones);
  if (!percentuais) return null;
  const chaves = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;
  const dominante = chaves.reduce((m, k) => (percentuais[k] > percentuais[m] ? k : m), 'z1');
  return { percentuais, dominante, totalSegundos: zones.duracaoTotalSegundos };
}

/** Sempre 4 semanas: o backend só devolve as que têm treino planejado; as ausentes entram como "sem plano". */
export function buildAdherenceReading(aderencia: AthleteAderencia[], hoje: Date = new Date()): AdherenceReading | null {
  if (aderencia.length === 0) return null;
  const segundaCorrente = startOfWeek(hoje, { weekStartsOn: 1 });
  const semanas: AdherenceWeek[] = [];
  for (let i = ADERENCIA_SEMANAS - 1; i >= 0; i--) {
    const inicio = new Date(segundaCorrente.getFullYear(), segundaCorrente.getMonth(), segundaCorrente.getDate() - i * 7);
    const chave = iso(inicio);
    const dado = aderencia.find((a) => a.semanaInicio === chave);
    semanas.push({
      semanaInicio: chave,
      planejado: dado?.totalPlanejado ?? 0,
      realizado: dado?.totalRealizado ?? 0,
      semPlano: !dado,
      corrente: i === 0,
    });
  }
  const planejado = semanas.reduce((t, s) => t + s.planejado, 0);
  const realizado = semanas.reduce((t, s) => t + s.realizado, 0);
  return { realizado, planejado, percentual: planejado > 0 ? Math.round((realizado / planejado) * 100) : 0, semanas };
}

export function buildRecordsReading(recordes: AthleteRecord[], provas: Prova[], hoje: Date = new Date()): RecordsReading {
  const rows = buildRecordRows(recordes).map((r) => ({
    ...r,
    novo: differenceInCalendarDays(hoje, parseISO(r.dataIso)) <= RECORDE_NOVO_DIAS,
  }));
  return { rows, proximaProva: buildProximaProva(provas, hoje) };
}
