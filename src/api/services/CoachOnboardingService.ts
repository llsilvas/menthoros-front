import type { Atleta } from '../../types/Atleta';
import type { CriarAtletaMinimo } from '../../types/CoachOnboarding';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Operações do wizard de boas-vindas do coach.
 *
 * **Não confundir com `OnboardingService`**, que é o onboarding do *atleta* (coleta de linha de
 * base). O backend usa a tag `coach-onboarding` justamente para que os dois não colidam no client
 * gerado.
 *
 * Nenhum endpoint aqui é novo além do de conclusão: criação de atleta e convite já existiam e são
 * reaproveitados.
 */
export class CoachOnboardingService {
    /**
     * Marca o wizard como concluído para o usuário autenticado.
     *
     * Idempotente: chamar de novo devolve `204` sem efeito, então o wizard pode chamar ao concluir
     * e ao "pular tudo" sem se preocupar com estado anterior.
     */
    public static concluir(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/me/onboarding/concluir',
            errors: {
                403: 'Acesso negado',
                404: 'Usuário não encontrado no tenant atual',
            },
        });
    }

    /**
     * Cria o primeiro atleta com o conjunto mínimo que o servidor exige.
     *
     * @throws ApiError 409 quando já existe atleta com o mesmo e-mail. **A unicidade é global**
     *         (constraint `uk_atleta_email`, não por tenant), então a mensagem ao coach precisa ser
     *         neutra: o conflito pode ser com um atleta de outra assessoria, e afirmar "já está na
     *         sua assessoria" seria falso.
     */
    public static criarPrimeiroAtleta(body: CriarAtletaMinimo): CancelablePromise<Atleta> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas',
            body,
            mediaType: 'application/json',
            errors: {
                400: 'Dados inválidos',
                409: 'Já existe um atleta com estes dados',
            },
        });
    }

    /**
     * Envia o convite de acesso ao atleta.
     *
     * **NÃO é idempotente**: `AtletaServiceImpl` documenta que cada chamada reenvia o convite
     * (efeito externo observável). Quem chama precisa impedir o segundo disparo — um clique a mais
     * manda outro e-mail para o atleta, que não tem como saber que foi engano.
     */
    public static convidarAtleta(atletaId: string): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/{id}/convite',
            path: { id: atletaId },
            errors: {
                403: 'Acesso negado',
                404: 'Atleta não encontrado',
                422: 'Atleta sem e-mail ou assessoria sem organização no Keycloak',
            },
        });
    }
}
