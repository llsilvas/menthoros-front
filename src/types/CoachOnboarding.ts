import type { diaSemana, nivelExperiencia } from './Atleta';

/**
 * Campos que o **servidor** exige para criar um atleta.
 *
 * `CreateAtleta` marca dez campos como obrigatórios, mas o Bean Validation do backend exige
 * apenas estes quatro (`AtletaInputDto`: `nome`, `objetivo`, `nivelExperiencia`,
 * `diasDisponiveis`). A diferença é decisão de UX do formulário completo, não do contrato — e num
 * wizard de boas-vindas pedir dez campos afugentaria justamente quem acabou de chegar.
 *
 * Não relaxamos `CreateAtleta`: as telas que o usam decidiram pedir mais, e mexer nisso é escopo
 * daquelas telas.
 */
export interface CriarAtletaMinimo {
    nome: string;
    /**
     * Opcional para o servidor **criar** o atleta, mas obrigatório para **convidá-lo**:
     * `gerarConvite` recusa com "Atleta sem email não pode ser convidado".
     *
     * Como a etapa seguinte do wizard é justamente o convite, pedir o e-mail aqui é o que impede
     * um fluxo que cadastra e depois não consegue convidar — sem o coach entender por quê.
     */
    email?: string;
    objetivo: string;
    nivelExperiencia: nivelExperiencia;
    diasDisponiveis: diaSemana[];
}

/** Etapas do wizard, na ordem em que aparecem. */
export type EtapaWizard = 'assessoria' | 'atleta' | 'convite';

export const ETAPAS: EtapaWizard[] = ['assessoria', 'atleta', 'convite'];
