import { type ReactNode, useEffect, useRef, useState } from "react";
import { Box, Button, Typography, useTheme, type SxProps, type Theme } from "@mui/material";

/* ----- scroll reveal (respects prefers-reduced-motion) ----- */
export function Reveal({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
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

/* ----- mono eyebrow with a lime tick ----- */
export function Eyebrow({ children, center }: { children: ReactNode; center?: boolean }) {
  const t = useTheme();
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: "'JetBrains Mono', monospace",
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

export function SectionHeading({ children, center, sx }: { children: ReactNode; center?: boolean; sx?: SxProps<Theme> }) {
  return (
    <Typography
      variant="h2"
      sx={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        letterSpacing: "-.02em",
        lineHeight: 1.08,
        fontSize: "clamp(26px, 3.6vw, 38px)",
        textAlign: center ? "center" : "left",
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

export function CtaButton({ children, fullWidth, onClick, type, disabled }: {
  children: ReactNode; fullWidth?: boolean;
  onClick?: () => void; type?: "button" | "submit"; disabled?: boolean;
}) {
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
        fontWeight: 600,
        fontSize: 15,
        textTransform: "none",
        borderRadius: 100,
        px: 3.75,
        py: 1.75,
        width: fullWidth ? "100%" : "auto",
        "&:hover": { bgcolor: "primary.light", transform: "translateY(-1px)" },
        "&:active": { bgcolor: "primary.dark" },
        transition: "background-color .15s ease, transform .15s ease",
      }}
    >
      {children}
    </Button>
  );
}

/* ----- priority badge: ALTA/MÉDIA/BAIXA = semantic alerts ----- */
export type Priority = "ALTA" | "MÉDIA" | "BAIXA";
export function PriorityBadge({ kind }: { kind: Priority }) {
  const t = useTheme();
  const color = { ALTA: t.palette.error.main, "MÉDIA": t.palette.warning.main, BAIXA: t.palette.success.main }[kind];
  return (
    <Box
      component="span"
      sx={{
        fontFamily: "'JetBrains Mono', monospace",
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
