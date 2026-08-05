import DocumentoLegal from '../legal/DocumentoLegal';
import {
  CONTATO_EMAIL,
  POLITICA_ATUALIZADA_EM,
  POLITICA_INTRODUCAO,
  POLITICA_SECOES,
} from './politicaPrivacidadeConteudo';

/**
 * Página pública da Política de Privacidade (`/privacidade`).
 *
 * Alcançada pela landing/waitlist e pelo `CoachConsentDialog` — é o texto que o coach declara ter
 * lido ao aceitar. Por isso o conteúdo vive em `politicaPrivacidadeConteudo.ts` e a data de
 * vigência (`POLITICA_VERSAO`) precisa bater com `app.lgpd.policy-version` no backend.
 *
 * Procedimento de bump (change `add-coach-lgpd-consent`): publicar esta página primeiro, só então
 * mudar a propriedade no backend. Na ordem inversa, o backend passa a exigir aceite de uma versão
 * que ainda não está no ar e todo aceite toma `409 CONSENT_VERSION_STALE`.
 *
 * O layout vive em `../legal/DocumentoLegal` desde que os Termos de Uso passaram a existir — os dois
 * documentos compartilham a mesma estrutura de dados e a mesma renderização.
 */
export default function PrivacidadePage() {
  return (
    <DocumentoLegal
      titulo="Política de Privacidade"
      atualizadoEm={POLITICA_ATUALIZADA_EM}
      introducao={POLITICA_INTRODUCAO}
      secoes={POLITICA_SECOES}
      contatoEmail={CONTATO_EMAIL}
    />
  );
}
