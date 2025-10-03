import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AtletasList from './pages/atletas/AtletasList';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AtletasList />
    </ThemeProvider>
  );
}

export default App;
