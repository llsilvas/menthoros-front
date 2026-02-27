import type { TreinoPlanejado, CreateTreinoPlanejado } from './TreinoPlanejado';

// Enums e tipos base
export type PlanoStatus = 'ATIVO' | 'CONCLUIDO' | 'CANCELADO' | 'PAUSADO';

export type MetodoGeracaoPlano = 'PROXIMA_SEMANA' | 'SEMANA_ATUAL';

// Interface principal do Plano Semanal
export interface PlanoSemanal {
  id?: string;
  atletaId: string;
  planoTreinoId?: string;
  semanaInicio: string; // ISO date string (LocalDate)
  semanaFim: string; // ISO date string (LocalDate)
  volumePlanejadoKm: number;
  volumeRealizadoKm: number;
  volumeAlvoKm: number;
  tsbInicio?: number; // Training Stress Balance
  tsbFim?: number; // Training Stress Balance
  status: PlanoStatus;
  observacoes?: string;
  objetivoSemanal?: string;
  treinosPlanejados?: TreinoPlanejado[];
}

// Interface para cria��o de Plano Semanal
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

// Interface para atualiza��o de Plano Semanal
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

// Fun��es utilit�rias
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
  const statusColors = {
    ATIVO: '#1976d2', // blue
    CONCLUIDO: '#388e3c', // green
    CANCELADO: '#d32f2f', // red
    PAUSADO: '#f57c00' // orange
  };

  return statusColors[status] || '#666666';
};

export const obterStatusLabel = (status: PlanoStatus): string => {
  const statusLabels = {
    ATIVO: 'Ativo',
    CONCLUIDO: 'Conclu�do',
    CANCELADO: 'Cancelado',
    PAUSADO: 'Pausado'
  };

  return statusLabels[status] || status;
};