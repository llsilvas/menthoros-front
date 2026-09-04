import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import showcase from "../assets/landing/showcase.mp4";
import poster from "../assets/landing/showcase-poster.jpg";

const objectPosition = { xs: "72% 20%", md: "70% 20%" };

// Fundo em vídeo do hero: preenche 100%/100% do pai (LandingPage.tsx posiciona esse pai como
// absoluto, ancorado no topo, atrás de Nav+Hero). Decorativo — a proposta de valor está no
// texto, não no vídeo — por isso aria-hidden e sem controles nativos.
// `poster` é um frame real do próprio vídeo (não desenhado) e evita o LCP ficar bloqueado pelo
// download completo do arquivo: preload="metadata" só busca os metadados, o poster pinta na hora.
// Respeita prefers-reduced-motion: sem autoplay, mostra só o poster estático (sem controles —
// como fundo decorativo atrás do texto, controles nativos ficariam soltos sem contexto).
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

  const fillSx = { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const, objectPosition };

  return (
    <Box aria-hidden sx={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {reduced ? (
        <Box component="img" src={poster} alt="" sx={fillSx} />
      ) : (
        <Box component="video" ref={videoRef} src={showcase} poster={poster} autoPlay muted loop playsInline preload="metadata" sx={fillSx} />
      )}
      {/* Degradê horizontal (desktop): mais escuro à esquerda, onde fica o texto do hero.
          Vertical (mobile, texto ocupa a largura toda): lavagem mais opaca uniforme. */}
      <Box
        sx={(t) => ({
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: {
            xs: `linear-gradient(180deg, ${alpha(t.palette.background.default, 0.25)} 0%, ${alpha(t.palette.background.default, 0.12)} 28%, ${alpha(t.palette.background.default, 0.78)} 58%, ${t.palette.background.default} 100%)`,
            md: `linear-gradient(90deg, ${alpha(t.palette.background.default, 0.8)} 0%, ${alpha(t.palette.background.default, 0.66)} 38%, ${alpha(t.palette.background.default, 0.28)} 62%, ${alpha(t.palette.background.default, 0.18)} 100%)`,
          },
        })}
      />
      {/* Funde topo e base no navy — sem isso o corte do vídeo contra a nav/seção seguinte fica seco. */}
      <Box
        sx={(t) => ({
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(180deg, ${alpha(t.palette.background.default, 0.18)} 0%, transparent 18%, transparent 78%, ${t.palette.background.default} 100%)`,
        })}
      />
    </Box>
  );
}
