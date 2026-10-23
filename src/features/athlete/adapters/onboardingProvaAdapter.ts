import type { OnboardingConclusaoInput } from '../../../types/Onboarding';
import type { DistanciaProva, TipoProva } from '../../../types/Prova';

/**
 * Estado local do passo "Prova alvo" do onboarding. É o que a tela coleta; `buildOnboardingConclusao`
 * traduz para o contrato do `/concluir`.
 *
 * `temProva` indefinido = o atleta ainda não respondeu. O tipo da prova não é perguntado: deriva da
 * distância (21 km → meia, 42 km → maratona, o resto → corrida de rua) e do percurso (trilha → trail).
 * Perguntar tipo E distância era redundante — "Meia Maratona" e "21 km" são a mesma resposta.
 */
export interface ProvaAlvoForm {
    temProva?: boolean;
    dataProva?: string;
    distancia?: DistanciaProva;
    trilha?: boolean;
    nomeProva?: string;
}

export function inferirTipoProva(distancia: DistanciaProva, trilha: boolean): TipoProva {
    if (trilha) return 'TRAIL';
    if (distancia === 'KM_21') return 'MEIA';
    if (distancia === 'KM_42') return 'MARATONA';
    return 'CORRIDA_RUA';
}

/** O passo está respondido: "ainda não tenho prova", ou prova com data e distância. */
export function isProvaAlvoRespondida(form: ProvaAlvoForm): boolean {
    if (form.temProva === false) return true;
    return form.temProva === true && Boolean(form.dataProva) && Boolean(form.distancia);
}

/** O que falta para o passo estar respondido, em linguagem da tela (vazio quando nada falta). */
export function faltaNaProvaAlvo(form: ProvaAlvoForm): string[] {
    if (form.temProva === undefined) return ['dizer se já tem uma prova'];
    if (form.temProva === false) return [];
    const falta: string[] = [];
    if (!form.dataProva) falta.push('data da prova');
    if (!form.distancia) falta.push('distância');
    return falta;
}

/** Corpo do `POST /concluir`: `{}` sem prova; com prova, tipo inferido e nome só se preenchido. */
export function buildOnboardingConclusao(form: ProvaAlvoForm): OnboardingConclusaoInput {
    if (form.temProva !== true || !form.dataProva || !form.distancia) return {};
    const nome = form.nomeProva?.trim();
    return {
        dataProva: form.dataProva,
        distancia: form.distancia,
        tipoProva: inferirTipoProva(form.distancia, form.trilha === true),
        ...(nome ? { nomeProva: nome } : {}),
    };
}
