import { type ReactNode, useState } from "react";
import { Box, Container, Link as MuiLink, Typography, useTheme, type SxProps, type Theme } from "@mui/material";
import * as C from "./content";
import { Reveal, Eyebrow, SectionHeading, CtaButton, monoFont } from "./primitives";
import { AttentionQueue, InterpretationCard } from "./ProductUI";
import { AccessForm } from "./AccessForm";
import logo from "../assets/landing/logo.png";
import founderPhoto from "../assets/landing/founder-placeholder.jpg";

// Hash router: a rota já usa `#`. Para rolar até uma seção, scrollIntoView por id
// (não `href="#..."`, que sobrescreveria a rota).
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* shared section shell */
function Section({ id, children, sx }: { id?: string; children: ReactNode; sx?: SxProps<Theme> }) {
  const t = useTheme();
  return (
    <Box component="section" id={id} sx={{ py: { xs: 8, md: 12 }, borderTop: `1px solid ${t.palette.divider}`, ...sx }}>
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
}

export function Nav() {
  return (
    <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2.75 }}>
      <Box component="img" src={logo} alt="Menthoros · AI Coaching" sx={{ height: 48, width: "auto", display: "block" }} />
      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3.75, alignItems: "center" }}>
        {C.nav.links.map((l) => (
          <MuiLink key={l.id} component="button" type="button" onClick={() => scrollToId(l.id)} underline="none"
            sx={{ color: "text.secondary", fontSize: 14, cursor: "pointer", "&:hover": { color: "text.primary" } }}>
            {l.label}
          </MuiLink>
        ))}
        <CtaButton onClick={() => scrollToId("acesso")}>{C.nav.cta}</CtaButton>
      </Box>
    </Container>
  );
}

export function Hero() {
  return (
    <Container maxWidth="lg" sx={{ pt: 7, pb: 10 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.08fr" }, gap: { xs: 4, md: 6 }, alignItems: "center" }}>
        <Box>
          <Eyebrow>{C.hero.eyebrow}</Eyebrow>
          <Typography variant="h1" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "-.02em", fontSize: "clamp(38px,5.4vw,60px)", lineHeight: 1.02, mt: 2.5 }}>
            {C.hero.titleLine1}<br />{C.hero.titleLine2Pre}<Box component="span" sx={{ color: "primary.main" }}>{C.hero.titleAccent}</Box>
          </Typography>
          <Box sx={{ width: 44, height: "1px", bgcolor: "primary.main", my: 3 }} />
          <Typography sx={{ color: "text.secondary", fontSize: 18, maxWidth: "42ch" }}>{C.hero.sub}</Typography>
          <Box sx={{ mt: 3.75 }}><CtaButton onClick={() => scrollToId("acesso")}>{C.hero.cta} →</CtaButton></Box>
          <Typography sx={{ fontFamily: monoFont, color: "text.disabled", fontSize: 12, mt: 2.25, letterSpacing: ".04em" }}>{C.hero.scarcity}</Typography>
        </Box>
        <Reveal><AttentionQueue /></Reveal>
      </Box>
    </Container>
  );
}

export function Pain() {
  const t = useTheme();
  return (
    <Section>
      <Reveal>
        <Eyebrow>{C.pain.eyebrow}</Eyebrow>
        <SectionHeading sx={{ my: 2, maxWidth: "20ch", mb: 5 }}>{C.pain.title}</SectionHeading>
      </Reveal>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 3 }}>
        {C.pain.items.map((it) => (
          <Reveal key={it.t}>
            <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: "16px", p: 3, height: "100%" }}>
              <Typography variant="h3" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 600, mb: 1.25 }}>{it.t}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 14.5 }}>{it.b}</Typography>
            </Box>
          </Reveal>
        ))}
      </Box>
    </Section>
  );
}

export function HowItWorks() {
  const t = useTheme();
  return (
    <Section id="how">
      <Reveal sx={{ textAlign: "center", mb: 6 }}>
        <Eyebrow center>{C.how.eyebrow}</Eyebrow>
        <SectionHeading center sx={{ mt: 2 }}>{C.how.title}</SectionHeading>
      </Reveal>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 3 }}>
        {C.how.steps.map((s) => (
          <Reveal key={s.n}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 1.75 }}>
                <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700, color: "primary.main" }}>{s.n}</Typography>
                <Box sx={{ flex: 1, height: "1px", bgcolor: t.palette.divider }} />
              </Box>
              <Typography variant="h3" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, mb: 1 }}>{s.t}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 14.5 }}>{s.b}</Typography>
            </Box>
          </Reveal>
        ))}
      </Box>
    </Section>
  );
}

export function Delta() {
  const t = useTheme();
  return (
    <Section id="delta">
      <Reveal>
        <Eyebrow>{C.delta.eyebrow}</Eyebrow>
        <SectionHeading sx={{ my: 1.5, maxWidth: "22ch" }}>{C.delta.title}</SectionHeading>
        <Typography sx={{ color: "text.secondary", fontSize: 16, maxWidth: "60ch", mb: 4.5 }}>{C.delta.sub}</Typography>
      </Reveal>
      <Reveal>
        <Box sx={{ bgcolor: t.palette.surfaceShift.panel, border: `1px solid ${t.palette.divider}`, borderRadius: "18px", p: 3.5 }}>
          <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "text.secondary" }}>{C.delta.context}</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" }, gap: 2.25, mt: 2 }}>
            <Box sx={{ bgcolor: "background.paper", border: `1px dashed ${t.palette.divider}`, borderRadius: "14px", p: 2.5 }}>
              <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "text.secondary" }}>IA PROPÔS</Typography>
              <Typography sx={{ mt: 1.25, fontSize: 14.5 }}>{C.delta.proposed}</Typography>
            </Box>
            <Box sx={{ display: "grid", placeItems: "center", color: "primary.main", fontSize: 22 }} aria-hidden>→</Box>
            <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.primary.main}`, borderRadius: "14px", p: 2.5 }}>
              <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "primary.main" }}>TREINADOR DECIDIU</Typography>
              <Typography sx={{ mt: 1.25, fontSize: 14.5 }}>{C.delta.decided}</Typography>
            </Box>
          </Box>
        </Box>
      </Reveal>
    </Section>
  );
}

export function Capabilities() {
  return (
    <Section>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr .95fr" }, gap: { xs: 4, md: 6 }, alignItems: "center" }}>
        <Reveal>
          <Eyebrow>{C.capabilities.eyebrow}</Eyebrow>
          <SectionHeading sx={{ my: 2, fontSize: "clamp(26px,3.4vw,34px)" }}>{C.capabilities.title}</SectionHeading>
          <Typography sx={{ color: "text.secondary", fontSize: 16, mb: 2.75 }}>{C.capabilities.sub}</Typography>
          {C.capabilities.bullets.map((b) => (
            <Box key={b} sx={{ display: "flex", gap: 1.5, py: 1, fontSize: 15 }}>
              <Box component="span" sx={{ color: "primary.main" }}>✓</Box>{b}
            </Box>
          ))}
        </Reveal>
        <Reveal><InterpretationCard /></Reveal>
      </Box>
    </Section>
  );
}

export function Fit() {
  const t = useTheme();
  const col = (head: string, items: string[], muted: boolean) => (
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: "16px", p: 3.5, height: "100%" }}>
      <Typography sx={{ fontFamily: monoFont, fontSize: 12, letterSpacing: ".12em", color: muted ? "text.disabled" : "primary.main", mb: 2 }}>{head}</Typography>
      {items.map((x) => (
        <Box key={x} sx={{ display: "flex", gap: 1.5, py: 1.1, fontSize: 14.5, color: muted ? "text.secondary" : "text.primary", borderTop: `1px solid ${t.palette.divider}` }}>
          <Box component="span" sx={{ color: muted ? "text.disabled" : "success.main" }}>{muted ? "—" : "✓"}</Box>{x}
        </Box>
      ))}
    </Box>
  );
  return (
    <Section id="fit">
      <Reveal sx={{ mb: 4.5 }}>
        <Eyebrow>{C.fit.eyebrow}</Eyebrow>
        <SectionHeading sx={{ mt: 2, fontSize: "clamp(26px,3.4vw,34px)" }}>{C.fit.title}</SectionHeading>
      </Reveal>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.25 }}>
        <Reveal>{col(C.fit.yes.head, C.fit.yes.items, false)}</Reveal>
        <Reveal>{col(C.fit.no.head, C.fit.no.items, true)}</Reveal>
      </Box>
    </Section>
  );
}

export function Trust() {
  const t = useTheme();
  return (
    <Section>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr .95fr" }, gap: { xs: 4, md: 6 }, alignItems: "center" }}>
        <Reveal>
          <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: "16px", overflow: "hidden" }}>
            <Box sx={{ position: "relative" }}>
              <Box component="img" src={founderPhoto} alt="Fundador do Menthoros" sx={{ width: "100%", height: 380, objectFit: "cover", objectPosition: "center 28%", display: "block" }} />
              <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 38%, ${t.palette.background.default}f0)` }} />
              <Box sx={{ position: "absolute", left: 24, right: 24, bottom: 20 }}>
                <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "primary.main", mb: 0.75 }}>{C.trust.founderLabel}</Typography>
                <Typography sx={{ fontSize: 14, color: "text.primary" }}>{C.trust.founderBio}</Typography>
              </Box>
            </Box>
          </Box>
        </Reveal>
        <Reveal>
          <SectionHeading sx={{ mb: 2, fontSize: "clamp(24px,3.2vw,32px)" }}>{C.trust.title}</SectionHeading>
          <Typography sx={{ color: "text.secondary", fontSize: 16, mb: 2.25 }}>{C.trust.body}</Typography>
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            {C.trust.chips.map((chip) => (
              <Box key={chip} component="span" sx={{ fontFamily: monoFont, fontSize: 12, color: "text.secondary", border: `1px solid ${t.palette.divider}`, borderRadius: 100, px: 1.6, py: 0.9 }}>{chip}</Box>
            ))}
          </Box>
        </Reveal>
      </Box>
    </Section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: "16px", px: 2.75, mb: 1.5 }}>
      <Box component="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        sx={{ width: "100%", background: "none", border: "none", color: "text.primary", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, py: 2.25, textAlign: "left", fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600 }}>
        {q}<Box component="span" sx={{ fontFamily: monoFont, color: "primary.main", fontSize: 20, flexShrink: 0 }}>{open ? "−" : "+"}</Box>
      </Box>
      {open && <Typography sx={{ color: "text.secondary", fontSize: 14.5, pb: 2.5, maxWidth: "60ch" }}>{a}</Typography>}
    </Box>
  );
}

export function Faq() {
  return (
    <Section>
      <Container maxWidth="md" disableGutters>
        <Reveal sx={{ textAlign: "center", mb: 4.5 }}>
          <Eyebrow center>{C.faq.eyebrow}</Eyebrow>
          <SectionHeading center sx={{ mt: 2 }}>{C.faq.title}</SectionHeading>
        </Reveal>
        {C.faq.items.map((it) => <FaqItem key={it.q} q={it.q} a={it.a} />)}
      </Container>
    </Section>
  );
}

export function FinalCta() {
  return (
    <Section id="acesso">
      <Container maxWidth="sm" disableGutters sx={{ textAlign: "center" }}>
        <Reveal>
          <Typography variant="h2" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "clamp(28px,4vw,44px)", lineHeight: 1.08 }}>
            {C.finalCta.titlePre}<Box component="span" sx={{ color: "primary.main" }}>{C.finalCta.titleAccent}</Box>{C.finalCta.titlePost}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 17, my: 2.5, mx: "auto", maxWidth: "48ch" }}>{C.finalCta.sub}</Typography>
        </Reveal>
        <Reveal><AccessForm /></Reveal>
      </Container>
    </Section>
  );
}

export function Footer() {
  const t = useTheme();
  return (
    <Box component="footer" sx={{ borderTop: `1px solid ${t.palette.divider}`, py: 4.5 }}>
      <Container maxWidth="lg" sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <Box component="img" src={logo} alt="Menthoros" sx={{ height: 40, width: "auto", display: "block", opacity: 0.92 }} />
        <Typography sx={{ fontFamily: monoFont, fontSize: 11, color: "text.disabled" }}>© {new Date().getFullYear()} Menthoros · a IA propõe, o treinador decide</Typography>
      </Container>
    </Box>
  );
}
