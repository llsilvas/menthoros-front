import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import type {} from '@mui/x-data-grid/themeAugmentation';
import { createHashRouter, RouterProvider } from 'react-router';
import DashboardLayout from './components/dashboard/DashboardLayout';
import AtletasList from './pages/atletas/AtletasList';
import LandingPage from './pages/landing/LandingPage';
import { colors, text, content } from './theme/tokens';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrastText,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.secondary.contrastText,
    },
    background: {
      default: colors.primary.dark,
      paper: 'rgba(255, 255, 255, 0.60)',
    },
    text: {
      primary: text.primary,
      secondary: text.secondary,
      disabled: text.disabled,
    },
    divider: content.divider,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'rgba(14, 49, 71, 0.4)',
        },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(14, 49, 71, 0.7)',
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
          '--DataGrid-containerBackground': 'rgba(255, 255, 255, 0.55)',
          backgroundColor: 'rgba(255, 255, 255, 0.55)',
          color: text.primary,
          borderColor: 'rgba(255,255,255,0.20)',
          '& .MuiDataGrid-mainContent': { backgroundColor: 'rgba(255, 255, 255, 0.55)' },
          '& .MuiDataGrid-virtualScroller': { backgroundColor: 'rgba(255, 255, 255, 0.55)' },
          '& .MuiDataGrid-overlayWrapper': { backgroundColor: 'rgba(255, 255, 255, 0.55)' },
          '& .MuiDataGrid-columnHeaders': { backgroundColor: 'rgba(255, 255, 255, 0.70)' },
          '& .MuiDataGrid-columnHeader': { backgroundColor: 'rgba(255, 255, 255, 0.70)' },
          '& .MuiDataGrid-columnHeaderTitle': { color: text.primary },
          '& .MuiDataGrid-columnSeparator': { color: 'rgba(0,0,0,0.12)' },
          '& .MuiDataGrid-cell': { color: text.primary, borderColor: 'rgba(0,0,0,0.06)' },
          '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(255, 255, 255, 0.20)' },
          '& .MuiDataGrid-footerContainer': { backgroundColor: 'rgba(255, 255, 255, 0.70)', color: text.primary, borderColor: 'rgba(255,255,255,0.20)' },
          '& .MuiTablePagination-root': { color: text.primary },
          '& .MuiTablePagination-selectIcon': { color: text.primary },
          '& .MuiIconButton-root': { color: text.primary },
        },
      },
    },
  },
});

const globalStyles = (
  <GlobalStyles
    styles={{
      html: {
        height: '100%',
        margin: 0,
        padding: 0,
      },
      body: {
        height: '100%',
        margin: 0,
        padding: 0,
      },
      '#root': {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      },
    }}
  />
);

const router = createHashRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: 'atletas',
        element: <AtletasList />,
      },
      {
        path: 'treinos',
        element: <div>Página de Treinos (em construção)</div>,
      },
      {
        path: 'planos',
        element: <div>Página de Planos (em construção)</div>,
      },
      {
        path: 'calendario',
        element: <div>Calendário (em construção)</div>,
      },
      {
        path: 'relatorios',
        element: <div>Relatórios (em construção)</div>,
      },
      {
        path: 'configuracoes',
        element: <div>Configurações (em construção)</div>,
      },
    ],
  },
]);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
