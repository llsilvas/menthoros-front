import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

// no-raw-color-literals: cor raw (hex/rgb/hsl) só é legítima na camada de tokens.
// Em qualquer outro arquivo .ts/.tsx é defect e falha o lint (CA1).
const noRawColorLiterals = [
  'error',
  {
    selector:
      'Literal[value=/#([0-9a-fA-F]{3}){1,2}\\b/], TemplateElement[value.raw=/#([0-9a-fA-F]{3}){1,2}\\b/]',
    message:
      'Cor raw (hex) proibida fora da camada de tokens. Use um token de src/shared/design-tokens ou src/theme.',
  },
  {
    selector:
      'Literal[value=/rgba?\\(|hsla?\\(/], TemplateElement[value.raw=/rgba?\\(|hsla?\\(/]',
    message:
      'Cor raw (rgb/hsl) proibida fora da camada de tokens. Use um token de src/shared/design-tokens ou src/theme.',
  },
]

// Allowlist permanente por path: única camada autorizada a conter cor raw.
const RAW_COLOR_ALLOWLIST = [
  '**/design-tokens/**',
  '**/theme/**',
  '**/workoutColors.ts',
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
]

// Ratchet transitório (baseline 0.1): arquivos sujos pré-migração com a regra
// desligada individualmente. Encolhe a cada fase da migração premium-v2 e deve
// chegar a ZERO na task 4.1 — então este bloco inteiro é removido.
const RAW_COLOR_RATCHET = [
  'src/App.tsx',
  'src/components/dashboard/DashboardHeader.tsx',
  'src/components/dashboard/DashboardLayout.tsx',
  'src/components/features/planos/DetalheTreinoDialog.tsx',
  'src/components/features/planos/WorkoutTimelineChart/WorkoutTimelineChart.tsx',
  'src/components/features/projecao/ProjecaoEvolutionChart.tsx',
  'src/features/athlete/components/PMCChart.tsx',
  'src/features/athlete/components/TodayHeroCard.tsx',
  'src/features/coach/components/TreinoEditDialog.tsx',
  'src/features/coach/layout/CoachSidebar.tsx',
  'src/features/coach/pages/CoachInboxPage.tsx',
  'src/pages/atletas/AtletasList.tsx',
  'src/pages/auth/LoginPage.tsx',
  'src/pages/home/HomePage.tsx',
  'src/pages/home/components/AssessmentInfoCard.tsx',
  'src/pages/home/components/AtletaStatusRow.tsx',
  'src/pages/home/components/AtletasFiltros.tsx',
  'src/pages/home/components/GraficoAdesaoWidget.tsx',
  'src/pages/home/components/ProvasProximasWidget.tsx',
  'src/pages/home/components/ResumoSemanalWidget.tsx',
  'src/pages/home/components/StatCard.tsx',
  'src/pages/home/components/StravaStatusWidget.tsx',
  'src/pages/home/components/TaxaAdesaoWidget.tsx',
  'src/pages/landing/LandingPage.tsx',
  'src/pages/reconciliacao/components/AtividadePendenteCard.tsx',
  'src/pages/reconciliacao/components/CandidatoItem.tsx',
  'src/shared/components/AthleteBottomNav.tsx',
  'src/shared/components/PhaseIndicator.tsx',
  'src/shared/components/StatusBadge.tsx',
  'src/shared/components/SuggestionTypeBadge.tsx',
  'src/shared/hooks/useLimeAudit.ts',
  'src/types/PlanoSemanal.ts',
  'src/types/TreinoRealizado.ts',
  'src/utils/safeValues.ts',
]

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': noRawColorLiterals,
    },
  },
  // Camada de tokens + testes: cor raw é legítima aqui.
  {
    files: RAW_COLOR_ALLOWLIST,
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  // Ratchet transitório — remover na task 4.1.
  {
    files: RAW_COLOR_RATCHET,
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
