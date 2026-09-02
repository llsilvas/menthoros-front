import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { extractDistanciaKey, extractStatusKey } from '../../../types/Prova';
import type { MotivoRevisaoProva, Prova } from '../../../types/Prova';
import { rotuloDistancia, semanasFaltando } from '../../../utils/racePreparation';

/** Chip de pendência no card "Provas" do perfil do coach. */
export interface CoachRacePendingChip {
  motivo: MotivoRevisaoProva;
  label: string;
}

/** Linha do card "Provas" no perfil do coach. */
export interface CoachRaceView {
  id: string;
  nome: string;
  dataLabel: string;
  distanciaLabel: string;
  alvo: boolean;
  cancelada: boolean;
  semanasFaltando: number;
  semanasMinimas?: number;
  preparacaoCurta: boolean;
  tempoObjetivo?: string;
  /** `null` quando o coach já registrou ciência. */
  pendente: CoachRacePendingChip | null;
}

export function pendingChipLabel(motivo: MotivoRevisaoProva | undefined, alvoAnteriorNome?: string): string {
  switch (motivo) {
    case 'NOVA': return 'Nova';
    case 'DATA_ALTERADA': return 'Data alterada';
    case 'ALVO_TROCADA': return alvoAnteriorNome ? `Alvo trocada (antes ${alvoAnteriorNome})` : 'Alvo trocada';
    case 'CANCELADA': return 'Cancelada pelo atleta';
    default: return 'Alterada';
  }
}

export function buildCoachRaceView(prova: Prova, hoje: Date = new Date()): CoachRaceView {
  const distancia = extractDistanciaKey(prova.distancia) ?? 'KM_10';
  const pendente = prova.revisadaPeloCoach === false
    ? { motivo: prova.motivoRevisao ?? 'NOVA', label: pendingChipLabel(prova.motivoRevisao, prova.alvoAnteriorNome) }
    : null;
  return {
    id: prova.id,
    nome: prova.nomeProva,
    dataLabel: format(parseISO(prova.dataProva), "d 'de' MMM 'de' yyyy", { locale: ptBR }),
    distanciaLabel: rotuloDistancia(distancia, prova.distanciaKm),
    alvo: prova.provaAlvo === true,
    cancelada: extractStatusKey(prova.statusProva) === 'CANCELADA',
    semanasFaltando: prova.semanasFaltando ?? semanasFaltando(prova.dataProva, hoje),
    semanasMinimas: prova.semanasPreparacao,
    preparacaoCurta: prova.preparacaoCurta === true,
    tempoObjetivo: prova.tempoObjetivo,
    pendente,
  };
}

/**
 * Card "Provas" do coach: provas futuras não canceladas + canceladas ainda pendentes de ciência
 * (que só chegam pelo endpoint de pendentes, porque a listagem normal as omite). Pendentes primeiro,
 * depois alvo, depois data.
 */
export function buildCoachRaceList(provas: Prova[], pendentes: Prova[], hoje: Date = new Date()): CoachRaceView[] {
  const hojeIso = format(hoje, 'yyyy-MM-dd');
  const porId = new Map<string, Prova>();
  provas.filter((p) => p.dataProva >= hojeIso && p.foiRealizada !== true).forEach((p) => porId.set(p.id, p));
  // A versão vinda de pendentes é a mais recente (traz motivo e flag) — prevalece sobre a da lista.
  pendentes.forEach((p) => porId.set(p.id, p));
  return [...porId.values()]
    .map((p) => buildCoachRaceView(p, hoje))
    .sort((a, b) =>
      Number(b.pendente !== null) - Number(a.pendente !== null)
      || Number(b.alvo) - Number(a.alvo)
      || a.dataLabel.localeCompare(b.dataLabel));
}
