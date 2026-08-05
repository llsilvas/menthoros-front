/**
 * Proteções para renderizar o avatar do usuário, que é **URL externa** sincronizada do Keycloak.
 *
 * Centralizado porque o avatar aparece em mais de um lugar (sidebar do coach, tela de
 * configurações) e a proteção precisa valer em todos. Repetir `slotProps` por componente já falhou
 * uma vez: a tela de configurações foi protegida e a sidebar não, deixando toda página do coach
 * carregando imagem de terceiro sem defesa.
 */

/**
 * Só permite esquemas de rede. Bloqueia `data:` (imagem arbitrária embutida), `javascript:` e
 * qualquer coisa exótica que venha a entrar em `avatar_url` — a coluna não valida formato, e o
 * valor é sincronizado de um sistema externo.
 *
 * @returns a URL quando segura, ou `undefined` para o `Avatar` cair no fallback de iniciais.
 */
export const safeAvatarSrc = (url?: string): string | undefined => {
    if (!url) return undefined;
    try {
        const { protocol } = new URL(url);
        return protocol === 'https:' || protocol === 'http:' ? url : undefined;
    } catch {
        // URL relativa ou malformada: não renderiza em vez de deixar o browser adivinhar.
        return undefined;
    }
};

/**
 * `slotProps` do MUI `Avatar` que impede o host da imagem de receber a rota interna do usuário no
 * header de referrer.
 */
export const AVATAR_IMG_SLOT_PROPS = {
    img: { referrerPolicy: 'no-referrer' as const },
};
