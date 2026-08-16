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
 * Restou só a conclusão: a criação de atleta saiu do wizard e vive na tela de Atletas, via
 * `AtletasService`.
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
}
