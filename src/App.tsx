import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import type {} from '@mui/x-data-grid/themeAugmentation';
import { createHashRouter, RouterProvider } from 'react-router';
import DashboardLayout from './components/dashboard/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomePage from './pages/home/HomePage';
import AtletasList from './pages/atletas/AtletasList';
import ReconciliacaoPage from './pages/reconciliacao/ReconciliacaoPage';
import LoginPage from './pages/auth/LoginPage';
import LandingPage from './pages/landing/LandingPage';
import CoachLayout from './features/coach/layout/CoachLayout';
// CoachAttentionQueuePage: sem rota em v1 — aguardando add-coach-queue-route
import CoachInboxPage from './features/coach/pages/CoachInboxPage';
import CoachAthletesPage from './features/coach/pages/CoachAthletesPage';
import CoachCalendarPage from './features/coach/pages/CoachCalendarPage';
import CoachInsightsPage from './features/coach/pages/CoachInsightsPage';
import AthleteLayout from './features/athlete/layout/AthleteLayout';
import AthleteHomePage from './features/athlete/pages/AthleteHomePage';
import AthletePlanPage from './features/athlete/pages/AthletePlanPage';
import AthleteProgressPage from './features/athlete/pages/AthleteProgressPage';
import AthleteCoachPage from './features/athlete/pages/AthleteCoachPage';
import AthleteProfilePage from './features/athlete/pages/AthleteProfilePage';
import ManualTrainingFormPage from './features/athlete/pages/ManualTrainingFormPage';
import { colors, text, content, backgrounds } from './theme/tokens';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main:         colors.primary.main,         // #D4FF3A — brand lime
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
          border: `1px solid rgba(255,255,255,0.12)`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'rgba(255,255,255,0.15)',
        },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.30)',
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
          borderColor: 'rgba(255,255,255,0.10)',
          '& .MuiDataGrid-mainContent':     { backgroundColor: backgrounds.card },
          '& .MuiDataGrid-virtualScroller': { backgroundColor: backgrounds.card },
          '& .MuiDataGrid-overlayWrapper':  { backgroundColor: backgrounds.card },
          '& .MuiDataGrid-columnHeaders':   { backgroundColor: backgrounds.panel },
          '& .MuiDataGrid-columnHeader':    { backgroundColor: backgrounds.panel },
          '& .MuiDataGrid-columnHeaderTitle': { color: text.secondary },
          '& .MuiDataGrid-columnSeparator': { color: 'rgba(255,255,255,0.10)' },
          '& .MuiDataGrid-cell':            { color: text.primary, borderColor: 'rgba(255,255,255,0.06)' },
          '& .MuiDataGrid-row:hover':       { backgroundColor: 'rgba(255,255,255,0.04)' },
          '& .MuiDataGrid-footerContainer': { backgroundColor: backgrounds.panel, color: text.secondary, borderColor: 'rgba(255,255,255,0.10)' },
          '& .MuiTablePagination-root':     { color: text.secondary },
          '& .MuiTablePagination-selectIcon': { color: text.secondary },
          '& .MuiIconButton-root':          { color: text.secondary },
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
    path: '/auth/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      // Shell legado — mantido durante transição para coach shell
      {
        element: <DashboardLayout />,
        children: [
          { index: true,                  element: <HomePage /> },
          { path: 'atletas',              element: <AtletasList /> },
          { path: 'reconciliacao',        element: <ReconciliacaoPage /> },
          { path: 'treinos',              element: <div>Página de Treinos (em construção)</div> },
          { path: 'planos',               element: <div>Página de Planos (em construção)</div> },
          { path: 'calendario',           element: <div>Calendário (em construção)</div> },
          { path: 'relatorios',           element: <div>Relatórios (em construção)</div> },
          { path: 'configuracoes',        element: <div>Configurações (em construção)</div> },
        ],
      },
      // Coach shell — standardize-coach-shell-ux
      {
        path: 'coach',
        element: <CoachLayout />,
        children: [
          { path: 'inbox',    element: <CoachInboxPage /> },
          { path: 'athletes', element: <CoachAthletesPage /> },
          { path: 'calendar', element: <CoachCalendarPage /> },
          { path: 'insights', element: <CoachInsightsPage /> },
        ],
      },
      // Athlete shell — refine-athlete-shell-ux
      {
        path: 'athlete',
        element: <AthleteLayout />,
        children: [
          { path: 'home',          element: <AthleteHomePage /> },
          { path: 'plan',          element: <AthletePlanPage /> },
          { path: 'progress',      element: <AthleteProgressPage /> },
          { path: 'coach',         element: <AthleteCoachPage /> },
          { path: 'profile',       element: <AthleteProfilePage /> },
          { path: 'training/log',  element: <ManualTrainingFormPage /> },
        ],
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
