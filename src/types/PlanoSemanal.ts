import type { TreinoPlanejado, CreateTreinoPlanejado } from './TreinoPlanejado';
import { surface, semantic } from '../theme/tokens';

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
    PLANEJADO: surface[500],
    INICIADO: semantic.info[500],
    EM_ANDAMENTO: semantic.warning[500],
    ATIVO: semantic.info[500],
    CONCLUIDO: semantic.success[500],
  };

  return statusColors[status] ?? surface[500];
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
