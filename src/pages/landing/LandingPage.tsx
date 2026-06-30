import { Box, GlobalStyles, ThemeProvider } from '@mui/material';
import landingTheme from '../../theme/landingTheme';
import {
  Nav, Hero, Pain, HowItWorks, Delta, Capabilities, Fit, Trust, Faq, FinalCta, Footer,
} from '../../landing/sections';

// Tema premium escopado à landing (ThemeProvider aninhado). Sem CssBaseline duplicado:
// o fundo navy vem do Box raiz; o GlobalStyles cobre só o foco visível (a11y).
export default function LandingPage() {
  return (
    <ThemeProvider theme={landingTheme}>
      <GlobalStyles
        styles={{
          '*:focus-visible': {
            outline: `2px solid ${landingTheme.palette.primary.main}`,
            outlineOffset: 3,
          },
        }}
      />
      <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>
        <Nav />
        <Hero />
        <Pain />
        <HowItWorks />
        <Delta />
        <Capabilities />
        <Fit />
        <Trust />
        <Faq />
        <FinalCta />
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
