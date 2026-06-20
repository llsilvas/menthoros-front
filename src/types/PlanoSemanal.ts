import type { TreinoPlanejado, CreateTreinoPlanejado } from './TreinoPlanejado';

// Enums e tipos base — espelha PlanoStatus.java no backend
export type PlanoStatus = 'PLANEJADO' | 'INICIADO' | 'EM_ANDAMENTO' | 'ATIVO' | 'CONCLUIDO';

export type MetodoGeracaoPlano = 'PROXIMA_SEMANA' | 'SEMANA_ATUAL';

// Interface principal do Plano Semanal
export interface PlanoSemanal {
  id?: string;
  atletaId: string;
  planoTreinoId?: string;
  semanaInicio: string;
  semanaFim: string;
  volumePlanejadoKm: number;
  volumeRealizadoKm: number;
  volumeAlvoKm: number;
  tsbInicio?: number;
  tsbFim?: number;
  status: PlanoStatus;
  observacoes?: string;
  objetivoSemanal?: string;
  treinosPlanejados?: TreinoPlanejado[];
}

// Interface para criacao de Plano Semanal
export interface CreatePlanoSemanal {
  atletaId: string;
  planoTreinoId?: string;
  semanaInicio: string;
  semanaFim: string;
  volumePlanejadoKm: number;
  volumeRealizadoKm: number;
  volumeAlvoKm: number;
  tsbInicio?: number;
  tsbFim?: number;
  status: PlanoStatus;
  observacoes?: string;
  objetivoSemanal?: string;
  treinosPlanejados?: CreateTreinoPlanejado[];
}

// Interface para atualizacao de Plano Semanal
export interface UpdatePlanoSemanal extends Partial<CreatePlanoSemanal> {
  id: string;
}

// Interface para filtros de Plano Semanal
export interface PlanoSemanalFilters {
  atletaId?: string;
  status?: PlanoStatus;
  semanaInicio?: string;
  semanaFim?: string;
  volumeMinKm?: number;
  volumeMaxKm?: number;
}

export const calcularProgressoVolume = (realizado: number, planejado: number): number => {
  if (planejado === 0) return 0;
  return Math.round((realizado / planejado) * 100);
};

export const formatarPeriodoSemana = (inicio: string, fim: string): string => {
  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);

  return `${dataInicio.toLocaleDateString('pt-BR')} - ${dataFim.toLocaleDateString('pt-BR')}`;
};

export const obterStatusColor = (status: PlanoStatus): string => {
  const statusColors: Record<PlanoStatus, string> = {
    PLANEJADO: '#9e9e9e',
    INICIADO: '#1976d2',
    EM_ANDAMENTO: '#f57c00',
    ATIVO: '#1976d2',
    CONCLUIDO: '#388e3c',
  };

  return statusColors[status] ?? '#666666';
};

export const obterStatusLabel = (status: PlanoStatus): string => {
  const statusLabels: Record<PlanoStatus, string> = {
    PLANEJADO: 'Planejado',
    INICIADO: 'Iniciado',
    EM_ANDAMENTO: 'Em andamento',
    ATIVO: 'Ativo',
    CONCLUIDO: 'Concluido',
  };

  return statusLabels[status] ?? status;
};
