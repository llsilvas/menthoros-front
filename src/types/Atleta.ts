export interface Atleta {
    id:string;
    nome:string;
    /** Usado pelo convite de acesso; pode estar ausente em atletas cadastrados antes do campo existir. */
    email?:string;
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
    /** Próximo vencimento (menor mensalidade em aberto, ou o próximo calculado); ausente junto com billingStatus. */
    nextDueDate?: string;
    /** Derivado em leitura das mensalidades em aberto; ausente sem contrato ou sem mensalidade em aberto. Nunca carrega valor. */
    billingStatus?: AthleteBillingStatus;
}

export interface CreateAtleta {
    nome:string;
    /**
     * Opcional para criar, **obrigatório para convidar**: `gerarConvite` recusa atleta sem e-mail.
     * Sem este campo no formulário, o convite de acesso era inalcançável pela interface.
     */
    email?:string;
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

export type nivelExperiencia = "INICIANTE" | "INTERMEDIARIO" | "AVANCADO" | "ELITE";
export type diaSemana = 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO';
export type Sexo = 'MASCULINO' | 'FEMININO' | 'OUTRO';

export const NIVEL_EXPERIENCIA_LABELS: Record<nivelExperiencia, string> = {
    INICIANTE: 'Iniciante',
    INTERMEDIARIO: 'Intermediário',
    AVANCADO: 'Avançado',
    ELITE: 'Elite',
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

/**
 * Status de cobrança do atleta, derivado em leitura das mensalidades em aberto do contrato
 * (`AthleteContract`/`AthleteInvoice` em `types/ContratoAtleta.ts`) — nunca persistido, nunca
 * carrega valor. Visível a todo treinador, diferente do contrato em si (só o proprietário).
 */
export type AthleteBillingStatus = 'UP_TO_DATE' | 'DUE_SOON' | 'OVERDUE';