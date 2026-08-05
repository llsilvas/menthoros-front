/**
 * Identidade do provedor **falso** usado pelos E2E, e do servidor que os atende.
 *
 * ## Por que isto existe
 *
 * A fixture PKCE precisa interceptar exatamente a URL que a aplicação chama. Antes, o issuer estava
 * escrito à mão no arquivo da fixture, com o endereço do Keycloak do HomeLab — e casava porque o
 * `.env` da máquina do autor apontava para o mesmo endereço. `.env` **não é versionado**: no runner
 * a aplicação caiu no default (`/auth`), a interceptação nunca casou e 10 dos 15 specs foram para o
 * login. Passavam localmente por acidente de ambiente.
 *
 * Agora o valor é único: o `playwright.config` injeta estas constantes como variáveis de ambiente do
 * servidor sob teste, e a fixture intercepta a partir delas. Nenhum `.env` participa, então o
 * resultado é o mesmo em qualquer máquina.
 *
 * O host é `127.0.0.1` numa porta onde não há nada: se a interceptação deixar de casar, a falha é
 * uma conexão recusada na hora — e não um timeout de 30 s contra um endereço que existe.
 */
export const IDP_ORIGIN = 'http://127.0.0.1:9099'
export const IDP_REALM = 'menthoros'
export const IDP_CLIENT_ID = 'menthoros-web'

export const ISSUER = `${IDP_ORIGIN}/realms/${IDP_REALM}`

/**
 * Porta dedicada ao E2E, distinta da do `npm run dev` (5174).
 *
 * Separar evita que a suíte reaproveite o servidor que a pessoa deixou aberto — que roda com o
 * `.env` dela e reintroduziria exatamente a dependência de ambiente que este arquivo elimina.
 */
export const PORTA_E2E = 5175

export const APP_ORIGIN = `http://localhost:${PORTA_E2E}`

/** Endereço de retorno: o app usa a raiz, não uma rota de callback (ver design D4). */
export const REDIRECT_URI = `${APP_ORIGIN}/`
