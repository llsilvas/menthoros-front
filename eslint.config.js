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
  // Exceção permanente: páginas com identidade visual própria fora do design
  // system dark (marketing/login). Palette bespoke (navies, limes, flat-UI) é
  // intencional e não deve ser forçada aos tokens da aplicação.
  {
    files: ['src/pages/landing/LandingPage.tsx', 'src/pages/auth/LoginPage.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
