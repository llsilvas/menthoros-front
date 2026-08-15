/**
 * Configuração da assessoria do coach autenticado.
 *
 * Espelha `AssessoriaMeOutputDto` do backend. As cores da assessoria **não** estão aqui de
 * propósito: nesta entrega elas não são editáveis nem consumidas pelo tema, e expor campo que
 * ninguém altera cria contrato morto.
 */
export interface AssessoriaMe {
    id: string;
    nome: string;
    temLogo: boolean;
    /** Rota do próprio produto (`/api/v1/assessorias/me/logo`); ausente quando não há logo. */
    logoUrl?: string | null;
    plano: PlanoAssessoria;
    uso: UsoDoPlano;
    /** Ecoar no PATCH/upload/DELETE: versão obsoleta devolve 409. */
    version: number;
}

export interface UsoDoPlano {
    atletas: number;
    maxAtletas: number | null;
    /** Inclui o dono, que permanece com papel de técnico no backend. */
    tecnicos: number;
    maxTecnicos: number | null;
}

export type PlanoAssessoria = 'BASIC' | 'PRO' | 'ENTERPRISE';

/**
 * Campos editáveis. O backend **rejeita** qualquer chave fora deste objeto — inclusive
 * `corPrimaria`/`corSecundaria` —, respondendo 400 em vez de ignorar em silêncio.
 */
export interface AssessoriaPatch {
    nome: string;
    version: number;
}

/** Limites do upload de logo, iguais aos validados no backend. */
export const LOGO_TAMANHO_MAXIMO_BYTES = 2 * 1024 * 1024;
export const LOGO_TIPOS_ACEITOS = ['image/png', 'image/jpeg'] as const;
export const LOGO_EXTENSOES_ACEITAS = '.png,.jpg,.jpeg';
