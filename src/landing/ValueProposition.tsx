import { Box, Typography } from "@mui/material";
import { founderOffer, garminNotice, hero, valueProposition } from "./content";
import { monoFont } from "./primitives";

/**
 * Bloco de proposta de valor exibido acima do formulário em `/waitlist` (FE-01 da spec de
 * conversão do Instagram, 2026-10-08). Medidas e hierarquia seguem o protótipo aprovado no canvas
 * de design (`OfferHero`): título grande, slogan inteiro em lime, frase, bullets numa linha só,
 * oferta curta com o preço em mono e aviso de Garmin com ícone.
 */
export function ValueProposition() {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1.5,
      }}
    >
      <Typography
        component="h1"
        sx={{
          m: 0,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: { xs: 23, sm: 34 },
          lineHeight: 1.15,
          color: "text.primary",
        }}
      >
        {valueProposition.title}
      </Typography>
      <Typography sx={{ m: 0, fontWeight: 600, fontSize: { xs: 14.5, sm: 18 }, lineHeight: 1.3, color: "primary.main" }}>
        {hero.titleLine1} {hero.titleLine2Pre}
        {hero.titleAccent}
      </Typography>
      <Typography sx={{ m: 0, maxWidth: 620, lineHeight: 1.5, fontSize: { xs: 13, sm: 15.5 }, color: "text.secondary" }}>
        {valueProposition.phrase}
      </Typography>

      <Box
        component="ul"
        sx={{
          listStyle: "none",
          p: 0,
          m: 0,
          mt: "2px",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: { xs: "flex-start", sm: "stretch" },
          gap: { xs: "7px", sm: "26px" },
        }}
      >
        {valueProposition.bullets.map((bullet) => (
          <Box
            component="li"
            key={bullet}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: "7px",
              maxWidth: { xs: "none", sm: 230 },
              textAlign: "left",
              fontSize: 13.5,
              lineHeight: 1.45,
              color: "text.secondary",
            }}
          >
            <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 15, height: 15, flexShrink: 0, mt: "2px", color: "primary.main" }}>
              <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Box>
            {bullet}
          </Box>
        ))}
      </Box>

      <Typography sx={{ m: 0, mt: "4px", fontWeight: 600, fontSize: { xs: 12.5, sm: 15 }, lineHeight: 1.35, color: "text.primary" }}>
        {valueProposition.offerPre}
        <Box component="span" sx={{ fontFamily: monoFont, color: "primary.main" }}>{founderOffer.afterTrialPrice}</Box>
        {valueProposition.offerPost}
      </Typography>

      <Typography
        sx={{ m: 0, display: "flex", alignItems: "center", gap: "7px", fontSize: { xs: 11, sm: 12.5 }, lineHeight: 1.35, color: "text.disabled" }}
      >
        <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 14, height: 14, flexShrink: 0 }}>
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth={1.8} />
          <path d="M12 8.5v4l3 2" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        </Box>
        <span>
          {garminNotice.pre}
          <Box component="strong" sx={{ color: "text.secondary" }}>{garminNotice.brand}</Box>
          {garminNotice.post}
        </span>
      </Typography>
    </Box>
  );
}
