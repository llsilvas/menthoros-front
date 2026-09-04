import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AthleteRecord } from '../../../types/AthleteProgress';

export interface RecordRow {
  distancia: string;
  tempoFormatado: string;
  /** ISO cru do contrato (`RecordeDto.data`), para cálculo — ex.: recorde "novo". */
  dataIso: string;
  /** Para exibição ("12 de jul"). A tela anterior mostrava o ISO cru. */
  dataFormatada: string;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Formata segundos como "HH:MM:SS" (sempre 2 dígitos por segmento, mesmo para tempos < 1h). */
export function formatTempoRecorde(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  return `${pad2(horas)}:${pad2(minutos)}:${pad2(segs)}`;
}

/** Mapeia `AthleteRecord[]` para linhas de exibição com o tempo já formatado. */
export function buildRecordRows(records: AthleteRecord[]): RecordRow[] {
  return records.map((r) => ({
    distancia: r.distancia,
    tempoFormatado: formatTempoRecorde(r.tempoSegundos),
    dataIso: r.data,
    dataFormatada: format(parseISO(r.data), "d 'de' MMM", { locale: ptBR }),
  }));
}
