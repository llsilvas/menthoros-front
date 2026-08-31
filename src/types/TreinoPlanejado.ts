export interface TreinoPlanejado {
  id?: string;
  tipoTreino: string;
  distanciaKm: number;
  duracaoMin?: string | number;
  observacao?: string;
  diaSemana: string | { value: string; label: string; short?: string; order?: number };
  realizado?: boolean;
  dataRealizacao?: string; // ISO date string
  fcAlvo?: string; // Faixa de Frequência Cardíaca Alvo
  ritmoAlvo?: string; // Ritmo Alvo (ex: "5:00 min/km")
  zonaAlvo?: string; // Zona alvo declarada no treino (ex: "Z2") — `TreinoPlanejadoOutputDto.zonaAlvo`
  percepcaoEsforcoEsperada?: number; // Percepção de Esforço Esperada (1-10)
  descricao?: string;
  dataTreino?: string;
  etapas?: EtapaTreino[];
  statusTreino?: string | { value: string; label: string; description?: string; color?: string };
  tssPlanejado?: number; // Training Stress Score
  intensidadePlanejada?: number; // Ex: 0.7, 1.15
  justificativaIa?: string; // Justificativa gerada pela IA
  fonteDados?: string | { value: string; label: string; description?: string; color?: string };
  treinoRealizadoId?: string;
  percepcaoEsforcoRealizado?: number;
  /** Há análise pós-treino pronta para o atleta neste treino (analise-ia-treino-atleta). */
  analiseAtletaDisponivel?: boolean;
}


// Interface para cria��o de Treino Planejado
export interface CreateTreinoPlanejado {
  tipoTreino: string;
  distanciaKm: number;
  duracaoMinutos?: number;
  intensidade: string;
  observacoes?: string;
  diaSemana: string;
  realizado?: boolean;
  dataRealizacao?: string;
}

export interface EtapaTreino {
  id?: string;
  ordem?: number;
  tipoEtapa: string | { value: string; label: string; description?: string; color?: string; order?: number };
  descricaoEtapa?: string;
  duracaoMin?: number;
  distanciaKm?: number;
  fcAlvoEtapa?: string; // Faixa de FC alvo da etapa (ex: "60-70% FCmax")
  repeticoes?: number;
  ritmoAlvo?: string;
  intensidade?: string;
  observacao?: string;
  /** UUID do bloco repetido; o backend persiste a série já expandida (N cópias com o mesmo id). */
  blocoId?: string;
  /** Total de repetições do bloco. Não há índice de repetição no contrato — ver `indexarRepeticoes`. */
  blocoRepeticoes?: number;
}
