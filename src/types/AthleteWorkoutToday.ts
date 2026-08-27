// Espelha TreinoHojeDto (GET/POST /api/v1/atletas/me/treinos/hoje) — modo treino do atleta.
// Alvos por etapa já vêm resolvidos pelo backend (mesma cadeia do push ao intervals.icu);
// o front nunca deriva bpm de zona.

export type AlvoPrimario = 'FC' | 'PACE' | 'NENHUM';

export interface EtapaAlvo {
  ordem?: number;
  tipoEtapa?: string;
  descricao?: string;
  duracaoMin?: number;
  distanciaKm?: number;
  blocoId?: string;
  blocoRepeticoes?: number;
  alvoPrimario: AlvoPrimario;
  fcAlvoMin?: number;
  fcAlvoMax?: number;
  paceAlvo?: string;
  /** Prescrição rebaixada a informação — o pace quando a FC venceu, ou a FC descartada. */
  textoSecundario?: string;
}

export interface TreinoHoje {
  /** Hoje no fuso do atleta. */
  hoje: string;
  id: string;
  tipoTreino?: string;
  descricao?: string;
  duracaoMin?: number;
  zonaAlvo?: string;
  tssPlanejado?: number;
  statusTreino?: string;
  /** Presente só quando o atleta pulou hoje. */
  motivoPulo?: string;
  puladoEm?: string;
  etapas?: EtapaAlvo[];
}

export type MotivoPulo = 'SEM_TEMPO' | 'CANSADO' | 'DOR' | 'OUTRO';

/**
 * Única fonte do rótulo em prosa ("Motivo: {label}.") — achado do QA (clean-code + frontend
 * review): três cópias deste mapa já tinham divergido (`'cansaço'` vs `'Cansado'`). O
 * `SkipWorkoutDialog` usa os mesmos valores capitalizados para os chips de escolha.
 */
export const MOTIVO_PULO_LABELS: Record<MotivoPulo, string> = {
  SEM_TEMPO: 'sem tempo', CANSADO: 'cansaço', DOR: 'dor', OUTRO: 'outro motivo',
};
