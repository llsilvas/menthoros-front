import { describe, it, expect } from 'vitest';
import { premiumTokens, primary } from './theme.premium';

// CA2 (refactor-color-system-premium-v2): lime (faixa verde-amarela de marca,
// primary[400..600]) só pode aparecer em tokens de brand ou primary-action.
// Allowlist per design.md: `primary.*` + os papéis de seleção/marca da
// sidebar (selectedBg é lime tint de seleção; selectedBorder/selectedIcon
// acompanham a seleção; headerColor é o brand mark do header) — os 3 últimos
// não estavam no array-exemplo do design.md (que listava só `selectedBg`),
// mas são a mesma categoria "primary-action"/"brand" que o texto do CA2
// permite; nenhum outro papel da sidebar (hoverBg/divider/text/textHover)
// resolve para lime hoje, então a allowlist continua estrita nesses 3 extras.
const LIME_SET = new Set<string>([primary[400], primary[500], primary[600]]);

// `sidebar.selectedBg` é `rgba(...)`, não hex — nunca bate com LIME_SET (só hex
// sólido) no filtro de `value.startsWith('#')` abaixo. Fica na allowlist como
// proteção prospectiva, caso vire hex sólido no futuro.
const ALLOWLISTED_ROLES = new Set([
  'sidebar.selectedBg',
  'sidebar.selectedBorder',
  'sidebar.selectedIcon',
  'sidebar.headerColor',
]);

function isAllowlisted(groupName: string, role: string): boolean {
  if (groupName === 'primary') return true;
  return ALLOWLISTED_ROLES.has(role);
}

describe('theme.premium — CA2: Lime Discipline', () => {
  const groups = Object.entries(premiumTokens) as Array<[string, Record<string, unknown>]>;

  for (const [groupName, group] of groups) {
    if (groupName === 'primary') continue; // allowlist inteira — nada a testar aqui

    for (const [key, value] of Object.entries(group)) {
      if (typeof value !== 'string' || !value.startsWith('#')) continue;
      const role = `${groupName}.${key}`;

      it(`${role} não resolve para lime fora da allowlist`, () => {
        if (!LIME_SET.has(value)) return;
        expect(isAllowlisted(groupName, role), `${role} = ${value} (lime) não está na allowlist`).toBe(true);
      });
    }
  }
});
