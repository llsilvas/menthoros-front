import { createTheme } from '@mui/material/styles';
import { activeTheme } from './activeTheme';
import { overlayWhite } from './overlays';

const { colors, text, content, backgrounds, semantic } = activeTheme;

/**
 * Tema global da aplicação — envolve TODAS as rotas (coach, atleta, landing) via `App.tsx`.
 *
 * Extraído de `App.tsx` para poder ser **estendido** por temas de shell (ver
 * `features/coach/theme/coachTheme.ts`). Os valores são os mesmos de antes, sem alteração: mudar
 * `typography` aqui atinge as telas do atleta, que não têm `ThemeProvider` próprio.
 */
export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main:         colors.primary.main,         // #BDDE5A — brand lime
      light:        colors.primary.light,
      dark:         colors.primary.dark,
      contrastText: colors.primary.contrastText, // #0A1628 navy on lime
    },
    secondary: {
      main:         colors.secondary.main,
      light:        colors.secondary.light,
      dark:         colors.secondary.dark,
      contrastText: colors.secondary.contrastText,
    },
    error:   { main: semantic.danger[500],  dark: semantic.danger[700],  light: semantic.danger[300]  },
    warning: { main: semantic.warning[500], dark: semantic.warning[700], light: semantic.warning[300] },
    success: { main: semantic.success[500], dark: semantic.success[700] },
    info:    { main: semantic.info[500],    dark: semantic.info[700] },
    background: {
      default: backgrounds.canvas, // #0A1628 — navy canvas
      paper:   backgrounds.card,   // #131F35 — elevated cards
    },
    text: {
      primary:   text.primary,   // #F8FAFC — off-white
      secondary: text.secondary, // #94A3B8 — muted
      disabled:  text.disabled,  // #475569
    },
    divider: content.divider,
  },
  typography: {
    fontFamily: '"Syne", "Inter", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: backgrounds.card,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: backgrounds.highest,
          border: `1px solid ${overlayWhite[12]}`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: overlayWhite[15],
        },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: overlayWhite[30],
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary.main,
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: text.icon,
        },
        colorAction: {
          color: text.iconMuted,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          '--DataGrid-containerBackground': backgrounds.card,
          backgroundColor: backgrounds.card,
          color: text.primary,
          borderColor: overlayWhite[10],
          '& .MuiDataGrid-mainContent':     { backgroundColor: backgrounds.card },
          '& .MuiDataGrid-virtualScroller': { backgroundColor: backgrounds.card },
          '& .MuiDataGrid-overlayWrapper':  { backgroundColor: backgrounds.card },
          '& .MuiDataGrid-columnHeaders':   { backgroundColor: backgrounds.panel },
          '& .MuiDataGrid-columnHeader':    { backgroundColor: backgrounds.panel },
          '& .MuiDataGrid-columnHeaderTitle': { color: text.secondary },
          '& .MuiDataGrid-columnSeparator': { color: overlayWhite[10] },
          '& .MuiDataGrid-cell':            { color: text.primary, borderColor: overlayWhite[6] },
          '& .MuiDataGrid-row:hover':       { backgroundColor: overlayWhite[4] },
          '& .MuiDataGrid-footerContainer': { backgroundColor: backgrounds.panel, color: text.secondary, borderColor: overlayWhite[10] },
          '& .MuiTablePagination-root':     { color: text.secondary },
          '& .MuiTablePagination-selectIcon': { color: text.secondary },
          '& .MuiIconButton-root':          { color: text.secondary },
        },
      },
    },
  },
});

export default appTheme;
