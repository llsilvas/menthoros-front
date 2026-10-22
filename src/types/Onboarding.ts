// Tipos de domínio do onboarding do atleta.
// Espelham AtletaOnboardingInputDto/OutputDto/OnboardingConclusaoInputDto/OutputDto do backend
// (POST/GET /api/v1/atletas/{atletaId}/onboarding, POST .../onboarding/concluir).

import type { nivelExperiencia, diaSemana } from './Atleta';
import type { TipoProva, DistanciaProva, Prova } from './Prova';

export type CanalIntegracao = 'INTERVALS_ICU' | 'MANUAL';
export type DispositivoMarca = 'GARMIN' | 'APPLE' | 'AMAZFIT' | 'COROS' | 'SAMSUNG' | 'POLAR' | 'SUUNTO' | 'OUTRO';
export type ConfidenceTier = 'A' | 'B' | 'C';
/** Backend guarda como String livre (sem enum) — union aqui reflete as únicas opções que a UI oferece. */
export type PercepcaoCondicionamento = 'RUIM' | 'REGULAR' | 'BOA' | 'OTIMA';

export const PERCEPCAO_CONDICIONAMENTO_LABELS: Record<PercepcaoCondicionamento, string> = {
    RUIM: 'Ruim', REGULAR: 'Regular', BOA: 'Boa', OTIMA: 'Ótima',
};

export const CANAL_INTEGRACAO_LABELS: Record<CanalIntegracao, string> = {
    INTERVALS_ICU: 'intervals.icu',
    MANUAL: 'Manual',
};

/** A ordem das chaves é a ordem dos chips do onboarding (prioridade do founder, 2026-10-15). */
export const DISPOSITIVO_MARCA_LABELS: Record<DispositivoMarca, string> = {
    GARMIN: 'Garmin',
    APPLE: 'Apple Watch',
    AMAZFIT: 'Amazfit',
    COROS: 'Coros',
    SAMSUNG: 'Samsung Galaxy Watch',
    POLAR: 'Polar',
    SUUNTO: 'Suunto',
    OUTRO: 'Outro',
};

/** Aceita `string` porque o backend pode devolver marca que este bundle ainda não conhece (front em cache). */
export function labelDispositivoMarca(valor: string): string {
    return DISPOSITIVO_MARCA_LABELS[valor as DispositivoMarca] ?? valor;
}

/** Campos do rascunho de onboarding — todos opcionais (CA8, salvar parcial). */
export interface OnboardingDraftInput {
    objetivo?: string;
    nivelExperiencia?: nivelExperiencia;
    diasDisponiveis?: diaSemana[];
    volumeSemanalMax?: number;
    temLesao?: boolean;
    descricaoLesao?: string;
    dataUltimaLesao?: string;
    historicoLesoes?: string;
    maiorTreinoRecenteKm?: number;
    duracaoDisponivelMin?: number;
    restricoes?: string;
    modalidade?: string;
    percepcaoCondicionamento?: PercepcaoCondicionamento;
    canalIntegracao?: CanalIntegracao;
    dispositivoMarca?: DispositivoMarca;
    dispositivoModelo?: string;
}

/** Perfil de onboarding persistido (rascunho ou completo) — retorno do GET/POST /onboarding. */
export interface AthleteOnboardingProfile extends OnboardingDraftInput {
    id: string;
    status: 'RASCUNHO' | 'COMPLETO';
    preenchidoPorCoach: boolean;
    criadoEm: string;
    atualizadoEm: string;
}

/** Dados da prova alvo para concluir o onboarding (CA13). */
export interface OnboardingConclusaoInput {
    dataProva: string;
    tipoProva: TipoProva;
    distancia: DistanciaProva;
    distanciaKm?: number;
    nomeProva?: string;
}

/** Resultado da conclusão: perfil migrado + prova alvo + baseline/score iniciais. */
export interface OnboardingConclusaoResult {
    status: string;
    provaAlvo?: Prova;
    ctlEstimado?: number;
    dataEstimativaBaseline?: string;
    confidenceScore?: number;
    confidenceTier?: ConfidenceTier;
}
