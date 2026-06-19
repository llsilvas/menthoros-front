export type UserRole = 'TECNICO' | 'ADMIN' | 'ATLETA';

export interface UsuarioAssessoria {
    id: string;
    nome: string;
    dominio?: string;
}

export interface UsuarioMeOutputDto {
    id: string;
    nome: string;
    email: string;
    role: UserRole;
    assessoria?: UsuarioAssessoria;
    atletaId?: string;
}
