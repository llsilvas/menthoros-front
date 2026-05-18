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
}
