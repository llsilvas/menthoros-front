import { Box, GlobalStyles, ThemeProvider } from '@mui/material';
import landingTheme from '../../theme/landingTheme';
import {
  Nav, Hero, Pain, HowItWorks, Delta, Capabilities, Fit, Trust, Faq, FinalCta, Footer,
} from '../../landing/sections';
import { VideoShowcase } from '../../landing/VideoShowcase';
import { GridBackdrop } from '../../landing/primitives';

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
        <GridBackdrop />
        {/* O backdrop é fixed com zIndex 0 — cria contexto de empilhamento e pintaria
            acima de irmãos estáticos. O wrapper posicionado mantém a grade atrás. */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Nav />
          <VideoShowcase />
          {/* Hero sobe e sobrepõe a base do vídeo (zona já fundida no navy pelo gradiente). */}
          <Box sx={{ position: 'relative', zIndex: 1, mt: { xs: -12, md: -28 } }}>
            <Hero />
          </Box>
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
      </Box>
    </ThemeProvider>
  );
}
