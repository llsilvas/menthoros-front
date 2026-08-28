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
          {/* Vídeo como fundo do hero: absoluto, ancorado no topo, fora do fluxo — Nav e Hero
              (irmãos, em fluxo normal) desenham por cima dele sem precisar ser filhos dele.
              Isso preserva o sticky da Nav (contido pelo wrapper que engloba a página inteira,
              não por este box de 100vh). */}
          <Box aria-hidden sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100vh', zIndex: 0, overflow: 'hidden' }}>
            <VideoShowcase />
          </Box>
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
      </Box>
    </ThemeProvider>
  );
}
