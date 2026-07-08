import { lazy, Suspense } from 'react';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import type {} from '@mui/x-data-grid/themeAugmentation';
import { createHashRouter, RouterProvider } from 'react-router';
import DashboardLayout from './components/dashboard/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import HomePage from './pages/home/HomePage';
import AtletasList from './pages/atletas/AtletasList';
import ReconciliacaoPage from './pages/reconciliacao/ReconciliacaoPage';
import LoginPage from './pages/auth/LoginPage';
import LandingPage from './pages/landing/LandingPage';
// Sem lazy: páginas públicas de pré-lançamento, carregam imediatamente sem spinner.
import WaitlistPage from './pages/waitlist/WaitlistPage';
import PrivacidadePage from './pages/waitlist/PrivacidadePage';
import CoachLayout from './features/coach/layout/CoachLayout';
// CoachAttentionQueuePage: sem rota em v1 — aguardando add-coach-queue-route
const CoachInboxPage = lazy(() => import('./features/coach/pages/CoachInboxPage'));
import CoachAthletesPage from './features/coach/pages/CoachAthletesPage';
import CoachCalendarPage from './features/coach/pages/CoachCalendarPage';
import CoachInsightsPage from './features/coach/pages/CoachInsightsPage';
import CoachPlanReviewPage from './features/coach/pages/CoachPlanReviewPage';
import CoachAthleteProfilePage from './features/coach/pages/CoachAthleteProfilePage';
import AthleteLayout from './features/athlete/layout/AthleteLayout';
import AthleteHomePage from './features/athlete/pages/AthleteHomePage';
import AthletePlanPage from './features/athlete/pages/AthletePlanPage';
import AthleteProgressPage from './features/athlete/pages/AthleteProgressPage';
import AthleteCoachPage from './features/athlete/pages/AthleteCoachPage';
import AthleteProfilePage from './features/athlete/pages/AthleteProfilePage';
import ManualTrainingFormPage from './features/athlete/pages/ManualTrainingFormPage';
import { activeTheme } from './theme/activeTheme';
import { overlayWhite } from './theme/overlays';
import { ROUTES } from './constants/routes';

const { colors, text, content, backgrounds, semantic } = activeTheme;

const theme = createTheme({
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
    path: '/waitlist',
    element: <WaitlistPage />,
  },
  {
    path: '/privacidade',
    element: <PrivacidadePage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      // Shell legado — apenas ADMIN; TECNICO e outros vão para coach/inbox
      {
        element: <RoleRoute allow={['ADMIN']} redirectTo={ROUTES.COACH_INBOX} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: 'inicio',               element: <HomePage /> },
              { path: 'atletas',              element: <AtletasList /> },
              { path: 'reconciliacao',        element: <ReconciliacaoPage /> },
              { path: 'treinos',              element: <div>Página de Treinos (em construção)</div> },
              { path: 'planos',               element: <div>Página de Planos (em construção)</div> },
              { path: 'calendario',           element: <div>Calendário (em construção)</div> },
              { path: 'relatorios',           element: <div>Relatórios (em construção)</div> },
              { path: 'configuracoes',        element: <div>Configurações (em construção)</div> },
            ],
          },
        ],
      },
      // Coach shell — standardize-coach-shell-ux
      {
        path: 'coach',
        element: <CoachLayout />,
        children: [
          { path: 'inbox',               element: <Suspense fallback={null}><CoachInboxPage /></Suspense> },
          { path: 'planos/revisao',      element: <CoachPlanReviewPage /> },
          { path: 'athletes', element: <CoachAthletesPage /> },
          { path: 'athletes/:atletaId', element: <CoachAthleteProfilePage /> },
          { path: 'calendar', element: <CoachCalendarPage /> },
          { path: 'insights', element: <CoachInsightsPage /> },
        ],
      },
      // Athlete shell — refine-athlete-shell-ux
      // Guard de role: só ATLETA acessa; não-atleta (coach/admin) cai no /inicio em vez
      // de bater 403 nos endpoints /me/* que exigem hasRole('ATLETA').
      {
        path: 'athlete',
        element: <RoleRoute allow={['ATLETA']} />,
        children: [
          {
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
