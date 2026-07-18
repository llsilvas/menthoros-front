/**
 * Cores cruas proibidas no codebase — usar os tokens de design-tokens em vez delas.
 *
 * Para detectar violações, rode:
 *   grep -rn --include="*.tsx" --include="*.ts" -E "(#[0-9a-fA-F]{3,6}|rgba?\()" src/
 *
 * Use auditRawColors() para verificar um arquivo específico.
 *
 * ── Lime Discipline (CA2, refactor-color-system-premium-v2) ──────────────────
 * Lime (faixa `primary[400..600]`, `#BDDE5A` canônico) só pode aparecer em
 * tokens de brand ou primary-action. Allowlist: `primary.*` + os papéis de
 * seleção/marca da sidebar (`sidebar.selectedBg/selectedBorder/selectedIcon/
 * headerColor`). Proibido em qualquer token de `readiness`, `trainingType`,
 * `trainingStage`, `zone`, `trainingStatus`, `semantic`, `text`, `surface*`.
 * Auditado por teste em `src/theme/limeDiscipline.test.ts` (percorre
 * `premiumTokens` inteiro — falha se um token fora da allowlist resolver
 * para lime).
 *
 * ── `info` nunca em brand/hero ────────────────────────────────────────────────
 * `semantic.info` (`#3B82F6`) é exclusivamente token informativo — nunca deve
 * aparecer em superfície de marca, hero ou call-to-action (`design.md`,
 * Constraint obrigatória 5). Sem teste automatizado dedicado hoje (a
 * verificação é por revisão de diff nas telas de marca/landing); se `info`
 * aparecer em `pages/landing/**` ou em qualquer componente de identidade de
 * marca (header, hero, CTA principal), é defeito.
 */

/** Mapeamento: cor crua → token canônico a usar no lugar */
export const FORBIDDEN_RAW_COLORS: Record<string, string> = {
  '#FF6B35': 'primary[500] — paleta anterior (laranja), substituída por lime',
  '#D4FF3A': 'primary[500]',
  '#0A1628': 'surface[900]',
  '#131F35': 'surface[800] / elevation.card',
  '#0E1B30': 'surface[850] / elevation.panel',
  '#1E293B': 'surface[700]',
  '#94A3B8': 'surface[400]',
  '#64748B': 'surface[500]',
  '#EF4444': 'semantic.danger[500]',
  '#B91C1C': 'semantic.danger[700]',
  '#FCA5A5': 'semantic.danger[300]',
  '#F59E0B': 'semantic.warning[500]',
  '#FBBF24': 'semantic.warning[400]',
  '#FCD34D': 'semantic.warning[300]',
  '#10B981': 'semantic.success[500]',
  '#047857': 'semantic.success[700]',
  '#3B82F6': 'semantic.info[500] ou categorical.cat1',
  '#1D4ED8': 'semantic.info[700]',
  '#A855F7': 'categorical.cat4',
  '#EC4899': 'categorical.cat5',
  '#14B8A6': 'categorical.cat6',
  '#8B5CF6': 'categorical.cat7',
  '#6B7280': 'categorical.cat8',
  // Cores não-canônicas encontradas no codebase (devem ser eliminadas)
  '#34c064': 'semantic.success[500] — verde não-canônico, substituído',
  '#e74c3c': 'semantic.danger[500] — vermelho não-canônico, substituído',
  '#3498db': 'categorical.cat1 ou semantic.info[500] — azul não-canônico',
  '#b1e92d': 'primary[500] — lime não-canônico (próximo mas diferente de #D4FF3A)',
};

/** Padrões de cor crua a detectar em arquivos de código */
const RAW_COLOR_PATTERNS = [
  // Hex com 3 ou 6 dígitos (ignora comentários de forma simples)
  /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g,
  // rgba e rgb
  /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g,
];

/**
 * Detecta usos de cores cruas em um trecho de código.
 * Retorna lista de matches encontrados.
 */
export function auditRawColors(fileContent: string): string[] {
  const violations: string[] = [];
  for (const pattern of RAW_COLOR_PATTERNS) {
    const matches = fileContent.match(pattern) ?? [];
    violations.push(...matches);
  }
  return [...new Set(violations)];
}
