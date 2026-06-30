import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import showcase from "../assets/landing/showcase.mp4";

// Showcase full-width abaixo do nav: loop ambiente mudo (sem áudio no arquivo) que se funde no
// navy por um gradiente na base, deixando o hero começar (e sobrepor) logo em seguida.
// Respeita prefers-reduced-motion (sem autoplay → exibe controles).
export function VideoShowcase() {
  const [reduced, setReduced] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const isReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setReduced(isReduced);
    // O atributo autoPlay nem sempre dispara no React/StrictMode — força o play.
    // play() pode lançar (jsdom) ou retornar undefined; blindado contra ambos.
    if (!isReduced) {
      try {
        videoRef.current?.play()?.catch(() => { /* autoplay bloqueado: ignora */ });
      } catch { /* ambiente sem suporte a mídia (ex.: jsdom) */ }
    }
  }, []);

  return (
    <Box sx={{ position: "relative", width: "100%", overflow: "hidden" }}>
      <Box
        component="video"
        ref={videoRef}
        src={showcase}
        autoPlay={!reduced}
        muted
        loop
        playsInline
        controls={reduced}
        preload="auto"
        aria-label="Demonstração do Menthoros em vídeo"
        sx={{
          display: "block",
          width: "100%",
          maxHeight: { xs: 340, md: 560 },
          objectFit: "cover",
        }}
      />
      {/* Fade para o navy na base — funde o vídeo no fundo e conecta com o hero. */}
      <Box
        aria-hidden
        sx={(t) => ({
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -1,
          height: { xs: 150, md: 280 },
          background: `linear-gradient(to bottom, transparent, ${t.palette.background.default})`,
          pointerEvents: "none",
        })}
      />
    </Box>
  );
}
