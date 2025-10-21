import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import { createHashRouter, RouterProvider } from 'react-router';
import DashboardLayout from './components/dashboard/DashboardLayout';
import AtletasList from './pages/atletas/AtletasList';
import HomePage from './pages/home/HomePage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0e3147', // Azul escuro do logo Menthoros
      light: '#1a4a66',
      dark: '#082130',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#b1e92d', // Verde claro do logo Menthoros
      light: '#c5f05a',
      dark: '#8bc120',
      contrastText: '#0e3147',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
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
