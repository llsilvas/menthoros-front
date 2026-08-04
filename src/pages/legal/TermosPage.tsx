import DocumentoLegal from './DocumentoLegal';
import {
  TERMOS_ATUALIZADOS_EM,
  TERMOS_INTRODUCAO,
  TERMOS_SECOES,
} from './termosDeUsoConteudo';
import { CONTATO_EMAIL } from '../waitlist/politicaPrivacidadeConteudo';

/**
 * Página pública dos Termos de Uso (`/termos`).
 *
 * Alcançada pelo `CoachConsentDialog` — é o texto que o coach declara ter lido ao aceitar. Antes
 * desta página existir, o dialog pedia aceite dos Termos sem oferecer onde lê-los, registrando
 * consentimento não informado em tabela append-only.
 *
 * A data de vigência (`TERMOS_VERSAO`) precisa bater com `app.lgpd.terms-version` no backend.
 * Procedimento de bump: publicar esta página primeiro, só então mudar a propriedade no backend —
 * na ordem inversa, todo aceite toma `409 CONSENT_VERSION_STALE`.
 */
export default function TermosPage() {
  return (
    <DocumentoLegal
      titulo="Termos de Uso"
      atualizadoEm={TERMOS_ATUALIZADOS_EM}
      introducao={TERMOS_INTRODUCAO}
      secoes={TERMOS_SECOES}
      contatoEmail={CONTATO_EMAIL}
    />
  );
}
