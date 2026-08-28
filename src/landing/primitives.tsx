import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { Box, Button, Typography, useTheme, type SxProps, type Theme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { overlayWhite, gridFadeMask } from "../theme/overlays";
import { radius } from "../theme/theme.premium";

/** Fonte monospace usada em toda a landing (eyebrows, métricas, badges). */
export const monoFont = "'JetBrains Mono', monospace";

/**
 * Altura fixa da nav, usada pelo `calc()` de centralização vertical do hero
 * (`Hero`, em `sections.tsx`). A nav sempre renderiza neste tamanho — mesmo antes do primeiro
 * scroll — para o `calc()` nunca ficar errado no load inicial; só o fundo/blur muda com o scroll.
 */
export const NAV_HEIGHT_PX = 64;

interface RevealProps { children: ReactNode; sx?: SxProps<Theme>; }

/* ----- scroll reveal (respects prefers-reduced-motion) ----- */
export function Reveal({ children, sx }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (setShown(true), io.unobserve(el))),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Box
      ref={ref}
      sx={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(16px)",
        transition: "opacity .6s ease, transform .6s ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

interface EyebrowProps { children: ReactNode; center?: boolean; }

/* ----- mono eyebrow with a lime tick ----- */
export function Eyebrow({ children, center }: EyebrowProps) {
  const t = useTheme();
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: monoFont,
        fontSize: 11,
        letterSpacing: ".22em",
        textTransform: "uppercase",
        color: "primary.main",
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        justifyContent: center ? "center" : "flex-start",
        "&::before": { content: '""', width: 24, height: 1, background: t.palette.primary.main },
      }}
    >
      {children}
    </Typography>
  );
}

interface SectionHeadingProps { children: ReactNode; center?: boolean; sx?: SxProps<Theme>; }

export function SectionHeading({ children, center, sx }: SectionHeadingProps) {
  // `\n` na copy marca quebra autoral; abaixo de md o <br> some e o rag decide.
  const parts = typeof children === "string" ? children.split("\n") : [children];

  return (
    <Typography
      variant="h2"
      sx={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        letterSpacing: "-.02em",
        lineHeight: 1.08,
        fontSize: "clamp(24px, 3vw, 32px)",
        textWrap: "pretty",
        textAlign: center ? "center" : "left",
        ...sx,
      }}
    >
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <Box component="br" sx={{ display: { xs: "none", md: "inline" } }} />}
          {part}
        </Fragment>
      ))}
    </Typography>
  );
}

interface CtaButtonProps {
  children: ReactNode; fullWidth?: boolean;
  onClick?: () => void; type?: "button" | "submit"; disabled?: boolean;
}

export function CtaButton({ children, fullWidth, onClick, type, disabled }: CtaButtonProps) {
  return (
    <Button
      onClick={onClick}
      type={type}
      disabled={disabled}
      disableElevation
      sx={{
        bgcolor: "primary.main",
        color: "primary.contrastText",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 500,
        fontSize: 14,
        letterSpacing: ".01em",
        lineHeight: 1.6,
        textTransform: "none",
        gap: 1,
        borderRadius: radius.sharp,
        px: 2.5,
        py: 1.25,
        width: fullWidth ? "100%" : "auto",
        // Sem lift no hover: a superfície lime já é o elemento mais alto da
        // página; deslocá-la no hover é ruído, não affordance.
        "&:hover": { bgcolor: "primary.light" },
        "&:active": { bgcolor: "primary.dark" },
        transition: "background-color .15s ease",
      }}
    >
      {children}
    </Button>
  );
}

/* ----- ícones: glifos de texto renderizam na fonte do sistema e não assentam
   na baseline; em SVG o traço acompanha o peso do resto ----- */

/** Todos herdam `currentColor` — a cor vem do contexto (primary, success, muted). */
export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <Box component="svg" viewBox="0 0 14 14" aria-hidden sx={{ width: size, height: size, flexShrink: 0, mt: "3px" }}>
      <path d="M2 7.5 L5.2 10.5 L12 3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

export function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <Box component="svg" viewBox="0 0 14 10" aria-hidden sx={{ width: size, height: (size * 10) / 14, flexShrink: 0 }}>
      <path d="M1 5 H12 M8 1 L12 5 L8 9" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

export function DashIcon({ size = 14 }: { size?: number }) {
  return (
    <Box component="svg" viewBox="0 0 14 14" aria-hidden sx={{ width: size, height: size, flexShrink: 0, mt: "3px" }}>
      <path d="M3 7 H11" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </Box>
  );
}

/* ----- marca de seção: § NN sobre numeral vazado ----- */
interface SectionMarkProps { n: string; label: string; }

/**
 * Rótulo `§ NN — nome` sobre o numeral vazado.
 *
 * O numeral é `color: transparent` + `-webkit-text-stroke`. Empilhado, nunca em
 * calha lateral: a calha empurra o bloco para o meio da coluna e o título passa
 * a ler como centralizado.
 */
export function SectionMark({ n, label }: SectionMarkProps) {
  const t = useTheme();
  // `textAlign` explícito: seções de cabeçalho centralizado (02, 07) herdariam
  // o center do wrapper e o § deixaria de ancorar a coluna à esquerda.
  return (
    <Box sx={{ mb: 1.5, textAlign: "left" }}>
      <Typography sx={{ fontFamily: monoFont, fontSize: 11, lineHeight: 1.5, letterSpacing: ".1em", color: "text.disabled", mb: 1.25 }}>
        <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>§ {n}</Box> — {label}
      </Typography>
      <Box
        component="span"
        sx={{
          display: "block",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
          fontSize: 40, lineHeight: 1, letterSpacing: "-.02em",
          color: "transparent",
          WebkitTextStroke: `1.5px ${t.palette.primary.main}`,
        }}
      >
        {n}
      </Box>
    </Box>
  );
}

/* ----- priority badge: ALTA/MÉDIA/BAIXA = semantic alerts ----- */
export type Priority = "ALTA" | "MÉDIA" | "BAIXA";

interface PriorityBadgeProps { kind: Priority; }

export function PriorityBadge({ kind }: PriorityBadgeProps) {
  const t = useTheme();
  const color = { ALTA: t.palette.error.main, "MÉDIA": t.palette.warning.main, BAIXA: t.palette.success.main }[kind];
  return (
    <Box
      component="span"
      sx={{
        fontFamily: monoFont,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".08em",
        px: "8px",
        py: "3px",
        borderRadius: "5px",
        color,
        bgcolor: `${color}22`,
      }}
    >
      {kind}
    </Box>
  );
}

/* ----- grade de fundo: textura fixa atrás do conteúdo da landing ----- */
const GRID_STEP_PX = 56;

/**
 * Textura de grade fixa atrás do conteúdo da landing.
 *
 * A máscara radial é o que separa "textura" de "papel de parede": sem ela a
 * grade encosta nas bordas do viewport e passa a ler como grid de wireframe.
 * Decorativo — `aria-hidden`, fora da árvore de acessibilidade.
 */
export function GridBackdrop() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: `linear-gradient(${overlayWhite[2]} 1px, transparent 1px), linear-gradient(90deg, ${overlayWhite[2]} 1px, transparent 1px)`,
        backgroundSize: `${GRID_STEP_PX}px ${GRID_STEP_PX}px`,
        maskImage: gridFadeMask,
        WebkitMaskImage: gridFadeMask,
      }}
    />
  );
}

/* ----- aura lime: iluminação verde do hero e do fechamento ----- */
interface LimeAuraProps {
  /** Diâmetro do halo. 720 no hero, 900 no fechamento. */
  size?: number;
  /** Opacidade do centro. Acima de ~0.22 vira neon e come o texto. */
  intensity?: number;
  /**
   * `headline` = atrás do título do hero, à esquerda. `offset` = fora do eixo,
   * à direita. `center` = centralizada (CTA final).
   */
  placement?: "headline" | "offset" | "center";
}

// Deslocamentos por posicionamento. `headline` usa px (e não %) porque a âncora
// é o bloco de título, cuja posição não acompanha a altura da seção. O `top`
// mantém o halo abaixo da faixa em que o hero sobrepõe o vídeo (mt negativo) —
// ali ele pintaria por cima do vídeo, não atrás.
const PLACEMENT = {
  headline: { left: -80, top: 80 },
  offset: { right: "-10%", top: "10%" },
  center: { left: "50%", top: "50%", transform: "translate(-50%, -50%)" },
} as const;

/**
 * Halo lime difuso. Decorativo e não-interativo.
 *
 * O `blur` não é o que suaviza a borda — o gradiente radial já entrega isso.
 * Ele existe pra matar o banding em degradê largo, que aparece em painel de
 * 8 bits. Por isso o raio é modesto: subir muito só custa composite.
 *
 * A seção hospedeira precisa de `position: relative` e `overflow: hidden` — sem
 * o `overflow` o halo estoura a lateral e cria scroll horizontal.
 */
export function LimeAura({ size = 720, intensity = 0.16, placement = "headline" }: LimeAuraProps) {
  const t = useTheme();
  const lime = t.palette.primary.main;

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        width: size,
        height: size,
        pointerEvents: "none",
        zIndex: 0,
        background: `radial-gradient(circle, ${alpha(lime, intensity)}, transparent 60%)`,
        filter: `blur(${placement === "center" ? 50 : 40}px)`,
        ...PLACEMENT[placement],
      }}
    />
  );
}
