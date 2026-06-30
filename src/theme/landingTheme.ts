import { createTheme } from '@mui/material/styles';
import { premiumTokens } from './theme.premium';

// Tema MUI da landing premium, derivado dos tokens canônicos (theme.premium.ts).
// Escopado à rota da landing via ThemeProvider — não afeta as telas autenticadas.
// `semantic` é flat nos tokens (danger/warning/...), não escala [500].

const { primary, surface, surfaceShift, text, semantic } = premiumTokens;

// A augmentation de Palette.surfaceShift vive em theme/mui.d.ts (global, incondicional).

export const landingTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: primary[500],
      light: primary[400],
      dark: primary[600],
      contrastText: primary.contrastText,
    },
    error: { main: semantic.danger },
    warning: { main: semantic.warning },
    success: { main: semantic.success },
    info: { main: semantic.info },
    background: {
      default: surface[900],
      paper: surfaceShift.card,
    },
    text: {
      primary: text.primary,
      secondary: text.secondary,
      disabled: text.muted,
    },
    divider: 'rgba(255,255,255,0.10)',
    surfaceShift: {
      panel: surfaceShift.panel,
      card: surfaceShift.card,
      raised: surfaceShift.raised,
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

export default landingTheme;
