import { lazy, Suspense } from 'react';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { appTheme } from './theme/appTheme';
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
import CadastroPage from './pages/cadastro/CadastroPage';
import PrivacidadePage from './pages/waitlist/PrivacidadePage';
import TermosPage from './pages/legal/TermosPage';
import CoachLayout from './features/coach/layout/CoachLayout';
// CoachAttentionQueuePage: sem rota em v1 — aguardando add-coach-queue-route
const CoachInboxPage = lazy(() => import('./features/coach/pages/CoachInboxPage'));
import CoachAthletesPage from './features/coach/pages/CoachAthletesPage';
import CoachCalendarPage from './features/coach/pages/CoachCalendarPage';
import CoachInsightsPage from './features/coach/pages/CoachInsightsPage';
import CoachSettingsPage from './features/coach/pages/CoachSettingsPage';
import CoachAssessoriaSettingsPage from './features/coach/pages/CoachAssessoriaSettingsPage';
import CoachPlanReviewPage from './features/coach/pages/CoachPlanReviewPage';
import CoachAthleteProfilePage from './features/coach/pages/CoachAthleteProfilePage';
import AthleteLayout from './features/athlete/layout/AthleteLayout';
import AthleteHomePage from './features/athlete/pages/AthleteHomePage';
import AthletePlanPage from './features/athlete/pages/AthletePlanPage';
import AthleteProgressPage from './features/athlete/pages/AthleteProgressPage';
import AthleteCoachPage from './features/athlete/pages/AthleteCoachPage';
import AthleteProfilePage from './features/athlete/pages/AthleteProfilePage';
import ManualTrainingFormPage from './features/athlete/pages/ManualTrainingFormPage';
import AthleteOnboardingPage from './features/athlete/pages/AthleteOnboardingPage';
import { ROUTES } from './constants/routes';


const theme = appTheme;

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
  // Auto-cadastro público: roda ANTES de existir sessão, então fica fora do ProtectedRoute.
  {
    path: '/cadastro',
    element: <CadastroPage />,
  },
  {
    path: '/privacidade',
    element: <PrivacidadePage />,
  },
  // Pública e fora do ProtectedRoute de propósito: o coach precisa conseguir LER os Termos a partir
  // do dialog de consentimento, que aparece justamente antes de ele poder operar.
  {
    path: '/termos',
    element: <TermosPage />,
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
          { path: 'athletes/:atletaId/onboarding', element: <AthleteOnboardingPage /> },
          { path: 'calendar', element: <CoachCalendarPage /> },
          { path: 'insights', element: <CoachInsightsPage /> },
          { path: 'settings', element: <CoachSettingsPage /> },
          { path: 'settings/assessoria', element: <CoachAssessoriaSettingsPage /> },
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
              { path: 'onboarding',    element: <AthleteOnboardingPage /> },
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
