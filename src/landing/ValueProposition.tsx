import { Box, Stack, Typography } from "@mui/material";
import { founderOffer, garminNotice, hero, valueProposition } from "./content";
import { overlayWhite } from "../theme/overlays";
import { surface } from "../theme/tokens";
import logo from "../assets/landing/logo.png";

/**
 * Bloco de proposta de valor exibido acima do formulário em `/waitlist` (FE-01 da spec de
 * conversão do Instagram, 2026-10-08): título, slogan, frase, bullets, oferta e aviso de Garmin.
 * Extraído do JSX que antes vivia hardcoded dentro de `WaitlistPage.tsx` para a copy ter uma
 * única fonte (`content.ts`) em vez de divergir da home com o tempo.
 */
export function ValueProposition() {
  const oferta = `${founderOffer.trialLine} ${founderOffer.afterTrialPre}${founderOffer.afterTrialPrice}${founderOffer.afterTrialPost}`;

  return (
    <Stack spacing={2} alignItems="center" sx={{ maxWidth: 640, mx: "auto", textAlign: "center" }}>
      <Box component="img" src={logo} alt="Menthoros" sx={{ height: 40, width: "auto" }} />
      <Typography variant="h4" sx={{ fontWeight: 700, color: surface[0] }}>
        {valueProposition.title}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, color: surface[0] }}>
        {hero.titleLine1} {hero.titleLine2Pre}
        {hero.titleAccent}
      </Typography>
      <Typography variant="body1" sx={{ color: overlayWhite[70] }}>
        {valueProposition.phrase}
      </Typography>
      <Box component="ul" sx={{ textAlign: "left", mx: "auto", pl: 2.5, m: 0 }}>
        {valueProposition.bullets.map((bullet) => (
          <Typography key={bullet} component="li" variant="body2" sx={{ color: overlayWhite[70] }}>
            {bullet}
          </Typography>
        ))}
      </Box>
      <Typography variant="body2" sx={{ color: surface[0], fontWeight: 600 }}>
        {oferta}
      </Typography>
      <Typography variant="caption" sx={{ color: overlayWhite[60] }}>
        {garminNotice.pre}
        <Box component="strong" sx={{ color: surface[0] }}>{garminNotice.brand}</Box>
        {garminNotice.post}
      </Typography>
    </Stack>
  );
}
