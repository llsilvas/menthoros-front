import { useEffect, useState } from 'react';
import { OpenAPI } from '../api/core/OpenAPI';
import { getAccessTokenSync, getTenantId } from '../context/auth/session';

/**
 * Carrega a logo da assessoria como object URL utilizável em `<img src>`.
 *
 * **Por que não basta apontar o `src` para a rota.** `GET /api/v1/assessorias/me/logo` exige JWT
 * (`@PreAuthorize` no controller), e o navegador **não envia o header `Authorization` numa
 * requisição de imagem** — o token vive no storage e é injetado pelo cliente HTTP, não pelo browser.
 * Um `<img src="…/logo">` sai sem credencial, o servidor responde 403, e a imagem nunca aparece.
 *
 * Era essa a causa de "enviei a logo e ela não carrega": não bastava propagar a URL até a shell,
 * porque a URL sozinha não é carregável. Aqui a imagem é buscada com o token, vira `blob:` e só
 * então chega ao `<img>`.
 *
 * O object URL é revogado no cleanup — sem isso cada troca de logo vazaria um blob na memória da
 * aba, que numa tela de uso contínuo não é desprezível.
 *
 * @param rota    caminho devolvido pelo backend; `null`/`undefined` quando não há logo
 * @param version versão da assessoria — muda a cada troca e força uma nova busca
 */
export function useLogoAssessoria(rota: string | null | undefined, version?: number): string | null {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!rota) {
            setObjectUrl(null);
            return;
        }

        let cancelado = false;
        let urlCriada: string | null = null;

        const carregar = async () => {
            try {
                const tenantId = getTenantId();
                const resposta = await fetch(`${OpenAPI.BASE}${rota}?v=${version ?? 0}`, {
                    headers: {
                        Authorization: `Bearer ${getAccessTokenSync()}`,
                        ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
                    },
                });
                if (!resposta.ok) return;

                const blob = await resposta.blob();
                if (cancelado) return;

                urlCriada = URL.createObjectURL(blob);
                setObjectUrl(urlCriada);
            } catch {
                // Falha de rede ou 403: a UI cai no fallback (iniciais / marca do produto). Um
                // quadrado quebrado fixo na navegação seria pior que não exibir a logo.
                if (!cancelado) setObjectUrl(null);
            }
        };

        void carregar();

        return () => {
            cancelado = true;
            if (urlCriada) URL.revokeObjectURL(urlCriada);
        };
    }, [rota, version]);

    return objectUrl;
}
