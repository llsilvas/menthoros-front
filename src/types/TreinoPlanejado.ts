export interface TreinoPlanejado {
  id?: string;
  tipoTreino: string;
  distanciaKm: number;
  duracaoMin?: number;
  observacao?: string;
  diaSemana: string | any;
  realizado?: boolean;
  dataRealizacao?: string; // ISO date string
  fcAlvo?: string; // Faixa de Frequência Cardíaca Alvo
  ritmoAlvo?: string; // Ritmo Alvo (ex: "5:00 min/km")
  percepcaoEsforcoEsperada?: number; // Percepção de Esforço Esperada (ex: "Moderado")
  descricao?: string;
  dataTreino?: string;
  etapas?: EtapaTreino[];
  statusTreino?: string | { value: string; label: string; description?: string; color?: string }; // Ex: "PLANEJADO", "REALIZADO", "CANCELADO" ou objeto
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
  tipoEtapa: string; // Ex: Aquecimento, Intervalo, Desaquecimento
  duracaoMin?: number;
  distanciaKm?: number;
  ritmoAlvo?: string;
  intensidade?: string;
  observacao?: string;
}
