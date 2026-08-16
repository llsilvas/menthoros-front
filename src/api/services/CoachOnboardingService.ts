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
}
