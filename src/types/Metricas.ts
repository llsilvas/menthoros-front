export interface SemanaAdesao {
  semana: string;
  dataInicio: string;
  dataFim: string;
  treinosPlanejados: number;
  treinosRealizados: number;
  percentualRealizacao: number;
  diasComTreino: number;
}

export interface AdesaoSemanal {
  atletaId: string;
  nomeAtleta: string;
  semanaAtual: SemanaAdesao;
  ultimas4Semanas: SemanaAdesao[];
  mediaUltimas4Semanas: number;
}

export interface ResumoDetalhes {
  treinos: number;
  km: number;
  tss: number;
}

export interface ResumoSemanalTreino {
  atletaId: string;
  nomeAtleta: string;
  semana: string;
  dataInicio: string;
  dataFim: string;
  resumo: {
    totalTreinos: number;
    volumeTotalKm: number;
    tssTotalSemana: number;
    tempoTotalMinutos: number;
    diasComTreino: number;
    diasSemTreino: number;
    ultimoTreino: string | null;
    diasDaSemana: Record<string, ResumoDetalhes>;
  };
}

export interface StravaStatusGlobal {
  totalAtletas: number;
  atletasConectados: number;
  percentualConectado: number;
}

export interface ProvaProxima {
  id: string;
  atletaId: string;
  nomeAtleta: string;
  nomeProva: string;
  dataProva: string;
  tipoProva: string;
  distancia: string | null;
  distanciaKm: number | null;
  objetivo: string;
  statusProva: string;
  diasFaltando: number;
}

export interface ProvasProximasResponse {
  provas: ProvaProxima[];
  total: number;
  dataConsulta: string;
}
