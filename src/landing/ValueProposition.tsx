import { Box, Stack, Typography } from "@mui/material";
import { founderOffer, garminNotice, hero, valueProposition } from "./content";
import { CheckIcon } from "./primitives";
import { overlayWhite } from "../theme/overlays";
import { surface } from "../theme/tokens";

/**
 * Bloco de proposta de valor exibido acima do formulário em `/waitlist` (FE-01 da spec de
 * conversão do Instagram, 2026-10-08): título, slogan, frase, bullets, oferta e aviso de Garmin.
 * Extraído do JSX que antes vivia hardcoded dentro de `WaitlistPage.tsx` para a copy ter uma
 * única fonte (`content.ts`) em vez de divergir da home com o tempo.
 *
 * Hierarquia segue o protótipo aprovado (canvas de design), não a da home: "IA para assessorias
 * de corrida" é o título de destaque (não um eyebrow pequeno), "A IA propõe. O treinador decide."
 * é o slogan secundário, inteiro em lime (não só a última palavra) — a home acentua só "decide.",
 * mas aqui o protótipo trata a frase inteira como uma única unidade de marca. Bullets em linha,
 * com ícone de check, não uma lista com marcador. Oferta é texto em destaque, sem card com borda.
 */
export function ValueProposition() {
  const oferta = `${founderOffer.trialLine} ${founderOffer.afterTrialPre}${founderOffer.afterTrialPrice}${founderOffer.afterTrialPost}`;

  return (
    // `alignSelf: "center"` (não `mx: "auto"`): este Stack é filho de outro Stack com `spacing`,
    // que aplica espaçamento via margem nos filhos — a margem horizontal automática perdia pra ela
    // na cascata e o bloco renderizava encostado na borda esquerda do container pai, em vez de
    // centralizado. `align-self` não é propriedade de margem, não sofre esse conflito.
    <Stack spacing={1.5} alignItems="center" sx={{ maxWidth: 640, alignSelf: "center", textAlign: "center" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: surface[0] }}>
        {valueProposition.title}
      </Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: "primary.main" }}>
        {hero.titleLine1} {hero.titleLine2Pre}
        {hero.titleAccent}
      </Typography>
      <Typography variant="body1" sx={{ color: overlayWhite[70] }}>
        {valueProposition.phrase}
      </Typography>

      <Stack direction="row" spacing={3} flexWrap="wrap" justifyContent="center" sx={{ pt: 0.5 }}>
        {valueProposition.bullets.map((bullet) => (
          <Stack key={bullet} direction="row" spacing={0.75} sx={{ maxWidth: 230, textAlign: "left" }}>
            <Box sx={{ color: "primary.main" }}><CheckIcon /></Box>
            <Typography variant="body2" sx={{ color: overlayWhite[70] }}>{bullet}</Typography>
          </Stack>
        ))}
      </Stack>

      <Typography sx={{ color: surface[0], fontWeight: 600, fontSize: 15, pt: 0.5 }}>
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
