import { Box, Typography, useTheme } from "@mui/material";
import { glass } from "../theme/tokens";
import { PriorityBadge, CheckIcon, monoFont, type Priority } from "./primitives";
import { radius, categorical, surface, aiHighlight, primary } from "../theme/theme.premium";

/**
 * CTL = categorical.teal · ATL = categorical.slate · TSB = warning (amber) — nunca `primary` aqui:
 * a "disciplina do lime" do design system reserva o lime para marca/ação/seleção, fora de métrica
 * e categoria (ver README do design system "Menthoros" — era um defeito real já corrigido em
 * `theme.premium.ts`; este gráfico tinha ficado pra trás usando `primary.main` pro CTL).
 */
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
      <path d={path(atl)} fill="none" stroke={categorical.slate} strokeWidth={1.6} />
      <path d={path(ctl)} fill="none" stroke={categorical.teal} strokeWidth={2.4} />
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
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, p: { xs: 2.5, sm: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography sx={{ fontFamily: monoFont, fontSize: 12, letterSpacing: ".12em", color: "text.secondary" }}>
          FILA DE ATENÇÃO
          <Box component="span" sx={{ color: "primary.contrastText", bgcolor: "primary.main", borderRadius: "5px", px: "7px", ml: 1, fontWeight: 700 }}>12</Box>
        </Typography>
        <Typography sx={{ fontFamily: monoFont, fontSize: 11, color: "text.disabled" }}>4 SEMANAS</Typography>
      </Box>
      {/* FE-06 (spec de conversão do Instagram, 2026-10-08): dado ilustrativo precisa de aviso
          visível ao usuário — antes só havia o comentário de código acima, não uma UI própria. */}
      <Typography sx={{ fontFamily: monoFont, fontSize: 10, fontStyle: "italic", color: "text.disabled", mb: 1 }}>
        Exemplo ilustrativo
      </Typography>

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
        <Box component="span" sx={{ color: categorical.teal }}>● CTL</Box>
        <Box component="span" sx={{ color: categorical.slate }}>● ATL</Box>
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
            <Box component="span" sx={{ color: "primary.main", display: "flex" }}><CheckIcon /></Box>{r}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Versão compacta da fila para /waitlist, desenhada no protótipo aprovado (canvas de design,
// artboard "Painel"): 3 atletas, o "por quê" da sugestão em destaque de IA, métricas e gráfico.
// Conteúdo ilustrativo fixo, como o resto deste arquivo — o rótulo "Exemplo ilustrativo" é visível.
const PREVIEW_ROWS = QUEUE_ROWS.slice(0, 3);
const PREVIEW_STATS: [string, string, "text" | "warning"][] = [["ATL", "86", "text"], ["CTL", "78", "text"], ["TSB", "−8", "warning"], ["A:C", "1.11", "warning"]];

export function QueuePreview() {
  const t = useTheme();
  const line = `1px solid ${surface[700]}`;
  return (
    <Box sx={{ bgcolor: "background.paper", border: line, borderRadius: radius.inner, p: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <Typography sx={{ fontFamily: monoFont, fontSize: 11, fontWeight: 600, letterSpacing: ".05em", color: "text.secondary" }}>
            FILA DE ATENÇÃO
          </Typography>
          <Box component="span" sx={{ fontFamily: monoFont, fontSize: 11, fontWeight: 700, color: "primary.main", bgcolor: `${primary[500]}26`, borderRadius: radius.pill, px: "8px", py: "1px" }}>
            12
          </Box>
        </Box>
        <Typography sx={{ fontSize: 10, fontStyle: "italic", color: "text.disabled" }}>Exemplo ilustrativo</Typography>
      </Box>

      <Box>
        {PREVIEW_ROWS.map(([initials, name, note, p], i) => (
          <Box key={name} sx={{ display: "flex", alignItems: "center", gap: "10px", py: "8px", borderBottom: i < PREVIEW_ROWS.length - 1 ? line : "none" }}>
            <Box sx={{ width: 30, height: 30, borderRadius: "50%", bgcolor: surface[700], display: "grid", placeItems: "center", fontFamily: monoFont, fontSize: 10.5, fontWeight: 600, color: "text.secondary", flexShrink: 0 }}>
              {initials}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: "text.primary" }}>{name}</Typography>
              <Typography sx={{ fontSize: 11.5, lineHeight: 1.25, color: "text.secondary" }}>{note}</Typography>
            </Box>
            <PriorityBadge kind={p} />
          </Box>
        ))}
      </Box>

      <Box sx={{ bgcolor: aiHighlight.bg, border: `1px solid ${aiHighlight.border}`, borderRadius: "8px", px: "13px", py: "11px", display: "flex", gap: "8px" }}>
        <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 14, height: 14, flexShrink: 0, mt: "1px", color: "primary.main" }}>
          <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4 5.7 21l2.3-7.2-6-4.6h7.6z" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: ".03em", color: "primary.main", mb: "3px" }}>
            POR QUE LUCAS ESTÁ EM ALTA
          </Typography>
          <Typography sx={{ fontSize: 11.5, lineHeight: 1.5, color: "text.secondary" }}>
            ATL subiu 18% em 6 dias, TSB em −8. Sugestão: reduzir 20% do volume da próxima longa.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderTop: line, pt: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
          {PREVIEW_STATS.map(([k, v, tone]) => (
            <Box key={k}>
              <Typography sx={{ fontFamily: monoFont, fontSize: 17, fontWeight: 600, lineHeight: 1.2, color: tone === "warning" ? "warning.main" : "text.primary" }}>{v}</Typography>
              <Typography sx={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1.2, letterSpacing: ".05em", color: "text.disabled" }}>{k}</Typography>
            </Box>
          ))}
        </Box>
        <Box component="svg" viewBox="0 0 600 140" preserveAspectRatio="none" role="img" aria-label="Carga de treinamento ao longo de 4 semanas" sx={{ width: "100%", height: "auto", display: "block" }}>
          <line x1="0" y1="80" x2="600" y2="80" stroke={surface[700]} strokeWidth={1} strokeDasharray="3 5" />
          <polyline points="0,110 120,100 240,88 360,72 480,58 600,42" fill="none" stroke={categorical.teal} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="0,95 120,105 240,78 360,88 480,48 600,30" fill="none" stroke={categorical.slate} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="0,45 120,52 240,62 360,78 480,95 600,112" fill="none" stroke={t.palette.warning.main} strokeWidth={1.8} strokeDasharray="2 5" strokeLinecap="round" strokeLinejoin="round" />
        </Box>
        <Box sx={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          {([["CTL", categorical.teal], ["ATL", categorical.slate], ["TSB", t.palette.warning.main]] as const).map(([k, c]) => (
            <Box key={k} sx={{ display: "flex", alignItems: "center", gap: "5px", fontSize: 10.5, color: "text.secondary" }}>
              <Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: c }} />
              {k}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
