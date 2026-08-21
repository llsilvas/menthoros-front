import { Box, Typography, useTheme } from "@mui/material";
import { glass } from "../theme/tokens";
import { PriorityBadge, monoFont, type Priority } from "./primitives";
import { radius } from "../theme/theme.premium";

/* CTL = primary · ATL = text.secondary (steel) · TSB = warning (amber) — token roles, no raw hex */
export function LoadChart() {
  const t = useTheme();
  const W = 360, H = 140, pad = 8;
  const ctl = [22, 30, 38, 44, 52, 60, 66, 71, 78];
  const atl = [40, 36, 50, 58, 54, 66, 62, 74, 71];
  const tsb = [70, 64, 58, 52, 48, 40, 36, 30, 26];
  const all = [...ctl, ...atl, ...tsb];
  const min = Math.min(...all), max = Math.max(...all);
  const x = (i: number, n: number) => pad + (i * (W - pad * 2)) / (n - 1);
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${x(i, arr.length).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" role="img" aria-label="Carga de treinamento ao longo de 4 semanas">
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={pad + g * (H - pad * 2)} y2={pad + g * (H - pad * 2)} stroke={t.palette.divider} strokeWidth={1} />
      ))}
      <path d={path(tsb)} fill="none" stroke={t.palette.warning.main} strokeWidth={1.6} strokeDasharray="3 3" opacity={0.85} />
      <path d={path(atl)} fill="none" stroke={t.palette.text.secondary} strokeWidth={1.6} />
      <path d={path(ctl)} fill="none" stroke={t.palette.primary.main} strokeWidth={2.4} />
    </svg>
  );
}

// Dados ilustrativos da UI de produto (não vêm do backend — são conteúdo de marketing fixo).
const QUEUE_ROWS: [string, string, string, Priority][] = [
  ["LF", "Lucas Ferreira", "Fadiga elevada · carga alta", "ALTA"],
  ["MC", "Mariana Costa", "Variabilidade baixa", "MÉDIA"],
  ["RA", "Rafael Almeida", "Progresso consistente", "BAIXA"],
  ["BL", "Beatriz Lima", "Retorno de lesão", "MÉDIA"],
  ["GR", "Gustavo Rocha", "Risco de sobrecarga", "BAIXA"],
];

export function AttentionQueue() {
  const t = useTheme();
  return (
    <Box sx={{ bgcolor: t.palette.surfaceShift.panel, border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, p: 2.5, boxShadow: glass.boxShadow }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography sx={{ fontFamily: monoFont, fontSize: 12, letterSpacing: ".12em", color: "text.secondary" }}>
          FILA DE ATENÇÃO
          <Box component="span" sx={{ color: "primary.contrastText", bgcolor: "primary.main", borderRadius: "5px", px: "7px", ml: 1, fontWeight: 700 }}>12</Box>
        </Typography>
        <Typography sx={{ fontFamily: monoFont, fontSize: 11, color: "text.disabled" }}>4 SEMANAS</Typography>
      </Box>

      {QUEUE_ROWS.map(([initials, name, note, p]) => (
        <Box key={name} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.25, borderTop: `1px solid ${t.palette.divider}` }}>
          <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: t.palette.surfaceShift.raised, display: "grid", placeItems: "center", fontSize: 11, color: "text.secondary", fontFamily: monoFont, flexShrink: 0 }}>{initials}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 500 }}>{name}</Typography>
            <Typography sx={{ fontSize: 12, color: "text.disabled" }}>{note}</Typography>
          </Box>
          <PriorityBadge kind={p} />
        </Box>
      ))}

      <Box sx={{ borderTop: `1px solid ${t.palette.divider}`, mt: 1.75, pt: 1.75, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1.25 }}>
        {([["ATL", "86", t.palette.text.primary], ["CTL", "78", t.palette.text.primary], ["TSB", "−8", t.palette.warning.main], ["A:C", "1.11", t.palette.success.main]] as const).map(([k, v, c]) => (
          <Box key={k}>
            <Typography sx={{ fontFamily: monoFont, fontSize: 10, color: "text.secondary", letterSpacing: ".1em" }}>{k}</Typography>
            <Typography sx={{ fontFamily: monoFont, fontSize: 19, fontWeight: 700, color: c }}>{v}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 1.75 }}><LoadChart /></Box>
      <Box sx={{ display: "flex", gap: 2, mt: 1, fontFamily: monoFont, fontSize: 10.5 }}>
        <Box component="span" sx={{ color: "primary.main" }}>● CTL</Box>
        <Box component="span" sx={{ color: "text.secondary" }}>● ATL</Box>
        <Box component="span" sx={{ color: "warning.main" }}>┄ TSB</Box>
      </Box>
    </Box>
  );
}

/* Capabilities view — deliberately DIFFERENT from the hero queue. Conteúdo ilustrativo fixo. */
export function InterpretationCard() {
  const t = useTheme();
  const metrics: [string, string, string?][] = [["DISTÂNCIA", "12,4 km"], ["PACE", "4:42"], ["DECOUPLING", "6,4%"]];
  return (
    <Box sx={{ bgcolor: t.palette.surfaceShift.panel, border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, p: 2.75, boxShadow: glass.boxShadow }}>
      <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "text.secondary" }}>INTERPRETAÇÃO DO TREINO · HUGO SILVA</Typography>
      <Box sx={{ display: "flex", gap: 1.75, my: 2, flexWrap: "wrap" }}>
        {metrics.map(([k, v]) => (
          <Box key={k} sx={{ flex: "1 1 90px" }}>
            <Typography sx={{ fontFamily: monoFont, fontSize: 10, color: "text.secondary", letterSpacing: ".1em" }}>{k}</Typography>
            <Typography sx={{ fontFamily: monoFont, fontSize: 20, fontWeight: 700 }}>{v}</Typography>
          </Box>
        ))}
        <Box sx={{ flex: "1 1 90px" }}>
          <Typography sx={{ fontFamily: monoFont, fontSize: 10, color: "text.secondary", letterSpacing: ".1em" }}>FORM</Typography>
          <Typography sx={{ fontFamily: monoFont, fontSize: 20, fontWeight: 700, color: "warning.main" }}>Fadigado</Typography>
        </Box>
      </Box>
      <Box sx={{ bgcolor: "background.default", border: `1px solid ${t.palette.divider}`, borderRadius: radius.inner, px: 2, py: 1.75, fontSize: 14, lineHeight: 1.5 }}>
        “Esse treino saiu <strong>acima da intenção</strong> e elevou a fadiga mais que o esperado. Sugiro ajuste de carga no próximo estímulo-chave.”
      </Box>
      <Box sx={{ mt: 1.75 }}>
        <Typography sx={{ fontFamily: monoFont, fontSize: 11, color: "text.secondary", letterSpacing: ".1em", mb: 1 }}>RECOMENDAÇÃO · EXPLICÁVEL</Typography>
        {["Reduzir volume no próximo bloco", "Manter o estímulo aeróbico de Z2", "Preservar o treino-chave da semana"].map((r) => (
          <Box key={r} sx={{ display: "flex", gap: 1.25, fontSize: 13.5, py: 0.5 }}>
            <Box component="span" sx={{ color: "primary.main" }}>✓</Box>{r}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
