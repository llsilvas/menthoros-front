export interface Atleta {
    id:string;
    nome:string;
    dataNascimento: string;
    sexo: Sexo;
    pesoKg:number;
    alturaCm:number;
    objetivo:string;
    nivelExperiencia: nivelExperiencia;
    diasDisponiveis: diaSemana[];
    diaPreferidoLongo: diaSemana;
    temLesao:boolean;
    descricaoLesao?:string;
    tipoPlanoAtleta?: TipoPlanoAtleta;
    dataVencimentoPlano?: string;
    /** Derivado pelo backend a partir de dataVencimentoPlano; ausente quando não cadastrada. */
    statusVencimentoPlano?: StatusVencimentoPlano;
}

export interface CreateAtleta {
    nome:string;
    dataNascimento: string;
    sexo: Sexo;
    pesoKg:number;
    alturaCm:number;
    objetivo:string;
    nivelExperiencia: nivelExperiencia;
    diasDisponiveis: diaSemana[];
    diaPreferidoLongo: diaSemana;
    temLesao:boolean;
    descricaoLesao?:string;
    tipoPlanoAtleta?: TipoPlanoAtleta;
    dataVencimentoPlano?: string;
}

export interface UpdateAtleta  extends Partial<CreateAtleta> {
    id:string;
}

export interface CrudState {
  atletas: Atleta[];
  loading: boolean;
  error: string | null;
  selectedAtleta: Atleta | null;
}

export interface AtletaDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (atleta: CreateAtleta | UpdateAtleta ) => Promise<void>;
  atleta?: Atleta;
}

export interface AtletaFilters {
  nome?: string;
  nivelExperiencia?: nivelExperiencia;
  objetivo?: string;
  temLesao?: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export type SortOrder = 'asc' | 'desc';

export interface SortState {
  sortBy: keyof Atleta;
  order: SortOrder;
}

// Validação de email simples
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função para gerar ID único
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export type nivelExperiencia = "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
export type diaSemana = 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO';
export type Sexo = 'MASCULINO' | 'FEMININO' | 'OUTRO';

export const NIVEL_EXPERIENCIA_LABELS: Record<nivelExperiencia, string> = {
    INICIANTE: 'Iniciante',
    INTERMEDIARIO: 'Intermediário',
    AVANCADO: 'Avançado',
};

export const DIA_SEMANA_LABELS: Record<diaSemana, string> = {
    DOMINGO: 'Domingo',
    SEGUNDA: 'Segunda',
    TERCA: 'Terça',
    QUARTA: 'Quarta',
    QUINTA: 'Quinta',
    SEXTA: 'Sexta',
    SABADO: 'Sábado',
};

/** Periodicidade do plano do atleta com a assessoria — distinto do plano SaaS da assessoria com a Menthoros. */
export type TipoPlanoAtleta = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

/** Status de vencimento derivado pelo backend a partir de dataVencimentoPlano vs. a data atual. */
export type StatusVencimentoPlano = 'EM_DIA' | 'PROXIMO_VENCIMENTO' | 'VENCIDO';