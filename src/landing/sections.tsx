import { type ReactNode, useEffect, useState } from "react";
import { Box, Container, Drawer, IconButton, Link as MuiLink, Stack, Typography, useTheme, type SxProps, type Theme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { Link as RouterLink } from "react-router";
import { ROUTES } from "../constants/routes";
import * as C from "./content";
import { Reveal, Eyebrow, SectionHeading, SectionMark, CtaButton, LimeAura, CheckIcon, ArrowIcon, DashIcon, monoFont, NAV_HEIGHT_PX } from "./primitives";
import { AttentionQueue, InterpretationCard } from "./ProductUI";
import { AccessForm } from "./AccessForm";
import logo from "../assets/landing/logo.png";
import { radius } from "../theme/theme.premium";

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

// A nav é chrome, e todo chrome desta landing fala na utilitária mono — eyebrow,
// § de seção, chips, métricas. Em Inter 14 ela era o único elemento de moldura
// com a voz do corpo de texto, e por isso lia como nav genérica.
const navLinkSx = {
  fontFamily: monoFont,
  fontSize: 12,
  letterSpacing: ".12em",
  textTransform: "uppercase" as const,
  color: "text.secondary",
  transition: "color .15s ease",
  "&:hover": { color: "text.primary" },
};

export function Nav() {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const close = () => setOpen(false);
  const goSection = (id: string) => { close(); scrollToId(id); };

  // A barra só ganha material depois que o conteúdo passa por baixo dela.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const blur = "blur(18px) saturate(160%)";

  return (
    <Box
      component="header"
      sx={{
        position: "sticky", top: 0, zIndex: 50,
        bgcolor: stuck ? alpha(t.palette.background.default, 0.72) : "transparent",
        backdropFilter: stuck ? blur : "none",
        WebkitBackdropFilter: stuck ? blur : "none",
        borderBottom: `1px solid ${stuck ? t.palette.divider : "transparent"}`,
        transition: "background-color .28s ease, border-color .28s ease",
      }}
    >
    {/* Grade de três colunas no desktop: os links de seção ficam centrados no
        eixo da página, não encostados no bloco de ações. No mobile só restam
        logo e hambúrguer, então volta a ser flex. */}
    {/* py e altura do logo são fixos (não variam com `stuck`) — o hero usa NAV_HEIGHT_PX
        (primitives.tsx) para centralizar verticalmente via calc(100vh - nav); se a nav
        crescesse antes do primeiro scroll, esse calc ficaria errado no load inicial. */}
    <Container maxWidth="lg" sx={{ display: { xs: "flex", md: "grid" }, gridTemplateColumns: { md: "1fr auto 1fr" }, alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
      <Box component="img" src={logo} alt="Menthoros · AI Coaching" sx={{ height: 38, width: "auto", display: "block" }} />

      {/* Desktop */}
      <Box component="nav" sx={{ display: { xs: "none", md: "flex" }, gap: 3.5, alignItems: "center", justifyContent: "center" }}>
        {C.nav.links.map((l) => (
          <MuiLink key={l.id} component="button" type="button" onClick={() => scrollToId(l.id)} underline="none"
            sx={{ ...navLinkSx, cursor: "pointer" }}>
            {l.label}
          </MuiLink>
        ))}
      </Box>

      {/* Ações de conta: separadas da navegação pela própria grade. */}
      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2.5, alignItems: "center", justifySelf: "end" }}>
        <MuiLink component={RouterLink} to={ROUTES.LOGIN} underline="none" sx={navLinkSx}>
          {C.nav.login}
        </MuiLink>
        <CtaButton onClick={() => scrollToId("acesso")}>{C.nav.cta}</CtaButton>
      </Box>

      {/* Mobile — hamburger + drawer */}
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        sx={{ display: { xs: "inline-flex", md: "none" }, color: "text.primary" }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        slotProps={{ paper: { sx: { width: 300, maxWidth: "85vw", bgcolor: "background.paper", p: 2.5 } } }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <IconButton onClick={close} aria-label="Fechar menu" sx={{ color: "text.secondary" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Stack spacing={1.5} alignItems="stretch">
          {C.nav.links.map((l) => (
            <MuiLink key={l.id} component="button" type="button" onClick={() => goSection(l.id)} underline="none"
              sx={{ ...navLinkSx, fontSize: 13, color: "text.primary", textAlign: "left", py: 0.5, cursor: "pointer", "&:hover": { color: "primary.main" } }}>
              {l.label}
            </MuiLink>
          ))}
          <MuiLink component={RouterLink} to={ROUTES.LOGIN} onClick={close} underline="none"
            sx={{ ...navLinkSx, fontSize: 13, color: "text.primary", py: 0.5, "&:hover": { color: "primary.main" } }}>
            {C.nav.login}
          </MuiLink>
          <Box sx={{ mt: 1 }}>
            <CtaButton fullWidth onClick={() => goSection("acesso")}>{C.nav.cta}</CtaButton>
          </Box>
        </Stack>
      </Drawer>
    </Container>
    </Box>
  );
}

export function Hero() {
  const t = useTheme();
  return (
    // position:relative + zIndex acima do vídeo de fundo (VideoShowcase, absoluto, zIndex 0 —
    // ver LandingPage.tsx). minHeight/alignItems centralizam o bloco na dobra — calc() usa
    // NAV_HEIGHT_PX (fixo) em vez da altura real da nav, que varia com o scroll. SEM
    // overflow:hidden aqui: se o conteúdo for mais alto que a viewport (janela baixa, zoom),
    // a seção cresce em vez de cortar título/CTA.
    <Box sx={{ position: "relative", zIndex: 1, minHeight: { md: `calc(100vh - ${NAV_HEIGHT_PX}px)` }, display: "flex", alignItems: "center" }}>
    <Container maxWidth="lg" sx={{ py: { xs: 7, md: 5 }, position: "relative", overflow: "hidden", width: "100%" }}>
      <LimeAura />
      {/* O halo é posicionado com zIndex 0 — sem este wrapper ele pintaria acima
          do conteúdo em fluxo, que não é posicionado. */}
      <Box sx={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.08fr" }, gap: { xs: 4, md: 6 }, alignItems: "center" }}>
        <Box>
          <Eyebrow>{C.hero.eyebrow}</Eyebrow>
          <Typography variant="h1" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "-.02em", fontSize: "clamp(34px,4.8vw,54px)", lineHeight: 1.04, mt: 2.5 }}>
            {C.hero.titleLine1}<br />{C.hero.titleLine2Pre}<Box component="span" sx={{ color: "primary.main" }}>{C.hero.titleAccent}</Box>
          </Typography>
          <Box sx={{ width: 44, height: "1px", bgcolor: "primary.main", my: 3 }} />
          <Typography sx={{ color: "text.secondary", fontSize: 18, maxWidth: "42ch" }}>{C.hero.sub}</Typography>
          <Box sx={{ mt: 5 }}><CtaButton onClick={() => scrollToId("acesso")}>{C.hero.cta}<ArrowIcon /></CtaButton></Box>
          <Typography sx={{ fontFamily: monoFont, color: "text.disabled", fontSize: 12, mt: 2.25, letterSpacing: ".04em" }}>{C.hero.scarcity}</Typography>
          {/* Credencial acima da dobra. As mesmas chips voltam no Trust, ali como
              aprofundamento — repetir prova técnica não incomoda. */}
          <Box sx={{ mt: 3.25, pt: 2.5, borderTop: `1px solid ${t.palette.divider}` }}>
            <Typography sx={{ fontFamily: monoFont, fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "text.disabled", mb: 1.25 }}>
              {C.hero.proofLabel}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {C.trust.chips.map((chip) => (
                <Box key={chip} component="span" sx={{ fontFamily: monoFont, fontSize: 11.5, letterSpacing: ".04em", color: "text.secondary", border: `1px solid ${t.palette.divider}`, borderRadius: radius.pill, px: 1.5, py: .9 }}>{chip}</Box>
              ))}
            </Box>
          </Box>
        </Box>
        <Reveal sx={{ mt: { md: 26 } }}><AttentionQueue /></Reveal>
      </Box>
    </Container>
    </Box>
  );
}

export function Pain() {
  const t = useTheme();
  return (
    <Section>
      <Reveal>
        <SectionMark n="01" label={C.pain.eyebrow} />
        <SectionHeading sx={{ my: 2, maxWidth: 520, mb: 5 }}>{C.pain.title}</SectionHeading>
      </Reveal>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 3 }}>
        {C.pain.items.map((it) => (
          <Reveal key={it.t}>
            <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, p: 3, height: "100%" }}>
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
  return (
    <Section id="how">
      <Reveal sx={{ mb: 6 }}>
        <SectionMark n="02" label={C.how.eyebrow} />
        <SectionHeading sx={{ mt: 2 }}>{C.how.title}</SectionHeading>
      </Reveal>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 3 }}>
        {C.how.steps.map((s) => (
          <Reveal key={s.n}>
            {/* Pílula mono no lugar do numeral grande em lime — o numeral colidia
                visualmente com o numeral vazado da marca de seção (02) acima. */}
            <Box>
              <Box
                component="span"
                sx={{
                  display: "inline-block", fontFamily: monoFont, fontSize: 11, letterSpacing: ".12em",
                  color: "primary.contrastText", bgcolor: "primary.main", borderRadius: radius.sharp,
                  px: 1, py: .375, fontWeight: 700, mb: 1.75,
                }}
              >
                PASSO {s.n}
              </Box>
              <Typography variant="h3" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, mb: 1 }}>{s.t}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 14.5 }}>{s.b}</Typography>
            </Box>
          </Reveal>
        ))}
      </Box>
      {/* A legenda sozinha diz o que o arco tentava desenhar: o loop fecha do 03
          de volta no 01. O desenho competia com a régua dos numerais e não
          sobrevivia à quebra para uma coluna. */}
      <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "text.disabled", mt: 4 }}>
        {C.how.loopLabel}
      </Typography>
    </Section>
  );
}

export function Delta() {
  const t = useTheme();
  return (
    <Box
      component="section"
      id="delta"
      sx={{
        bgcolor: t.palette.surfaceShift.panel,
        borderTop: `1px solid ${t.palette.divider}`,
        borderBottom: `1px solid ${t.palette.divider}`,
        py: { xs: 9, md: 16 },
        position: "relative",
        overflow: "hidden",
        // Fio lime no topo: marca a seção sem inflar tipografia.
        "&::before": {
          content: '""', position: "absolute", left: 0, right: 0, top: 0, height: "1px",
          background: `linear-gradient(90deg, transparent, ${t.palette.primary.main}, transparent)`,
          opacity: .5,
        },
      }}
    >
      <Container maxWidth="lg">
      <Reveal>
        <SectionMark n="03" label={C.delta.eyebrow} />
        <SectionHeading sx={{ my: 1.5, fontSize: "clamp(28px,3.8vw,40px)" }}>{C.delta.title}</SectionHeading>
        <Typography sx={{ color: "text.secondary", fontSize: 16, maxWidth: "60ch", mb: 4.5 }}>{C.delta.sub}</Typography>
      </Reveal>
      <Reveal>
        <Box sx={{ bgcolor: "background.default", border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, p: 3.5 }}>
          <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "text.secondary" }}>{C.delta.context}</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" }, gap: 2.25, mt: 2 }}>
            <Box sx={{ bgcolor: "background.paper", border: `1px dashed ${t.palette.divider}`, borderRadius: radius.inner, p: 2.5 }}>
              <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "text.secondary" }}>IA PROPÔS</Typography>
              <Typography sx={{ mt: 1.25, fontSize: 14.5 }}>{C.delta.proposed}</Typography>
            </Box>
            <Box sx={{ display: "grid", placeItems: "center", color: "primary.main" }}><ArrowIcon size={22} /></Box>
            <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.primary.main}`, borderRadius: radius.inner, p: 2.5 }}>
              <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "primary.main" }}>TREINADOR DECIDIU</Typography>
              <Typography sx={{ mt: 1.25, fontSize: 14.5 }}>{C.delta.decided}</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2.5, pt: 2.25, borderTop: `1px solid ${t.palette.divider}`, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Box component="span" sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "primary.main", flexShrink: 0, pt: "2px" }}>Δ</Box>
            <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>{C.delta.feedback}</Typography>
          </Box>
        </Box>
      </Reveal>
      </Container>
    </Box>
  );
}

export function Capabilities() {
  return (
    <Section>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr .95fr" }, gap: { xs: 4, md: 6 }, alignItems: "center" }}>
        <Reveal>
          <SectionMark n="04" label={C.capabilities.eyebrow} />
          <SectionHeading sx={{ my: 2, fontSize: "clamp(26px,3.4vw,34px)" }}>{C.capabilities.title}</SectionHeading>
          <Typography sx={{ color: "text.secondary", fontSize: 16, mb: 2.75 }}>{C.capabilities.sub}</Typography>
          {C.capabilities.bullets.map((b) => (
            <Box key={b} sx={{ display: "flex", gap: 1.5, py: 1, fontSize: 15 }}>
              <Box component="span" sx={{ color: "primary.main", display: "flex" }}><CheckIcon /></Box>{b}
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
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, p: 3.5, height: "100%" }}>
      <Typography sx={{ fontFamily: monoFont, fontSize: 12, letterSpacing: ".12em", color: muted ? "text.disabled" : "primary.main", mb: 2 }}>{head}</Typography>
      {items.map((x) => (
        <Box key={x} sx={{ display: "flex", gap: 1.5, py: 1.1, fontSize: 14.5, color: muted ? "text.secondary" : "text.primary", borderTop: `1px solid ${t.palette.divider}` }}>
          <Box component="span" sx={{ color: muted ? "text.disabled" : "success.main", display: "flex" }}>{muted ? <DashIcon /> : <CheckIcon />}</Box>{x}
        </Box>
      ))}
    </Box>
  );
  return (
    <Section id="fit">
      <Reveal sx={{ mb: 4.5 }}>
        <SectionMark n="05" label={C.fit.eyebrow} />
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
        {/* Citação do fundador + avatar de iniciais — sem foto até existir uma foto real
            (a anterior era um modelo de banco de imagens com "Leandro" escrito embaixo). */}
        <Reveal>
          <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, p: 3.5, display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "8px", bgcolor: t.palette.surfaceShift.raised, display: "grid", placeItems: "center", fontFamily: monoFont, fontSize: 14, fontWeight: 700, color: "primary.main", flexShrink: 0 }}>L</Box>
              <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: ".14em", color: "text.secondary" }}>{C.trust.founderLabel}</Typography>
            </Box>
            <Typography sx={{ fontSize: 16, lineHeight: 1.55, color: "text.primary" }}>{C.trust.founderBio}</Typography>
          </Box>
        </Reveal>
        <Reveal>
          <SectionMark n="06" label={C.trust.founderLabel} />
          <SectionHeading sx={{ mb: 2, fontSize: "clamp(24px,3.2vw,32px)" }}>{C.trust.title}</SectionHeading>
          <Typography sx={{ color: "text.secondary", fontSize: 16, mb: 2.25 }}>{C.trust.body}</Typography>
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            {C.trust.chips.map((chip) => (
              <Box key={chip} component="span" sx={{ fontFamily: monoFont, fontSize: 12, color: "text.secondary", border: `1px solid ${t.palette.divider}`, borderRadius: radius.pill, px: 1.6, py: 0.9 }}>{chip}</Box>
            ))}
          </Box>
        </Reveal>
      </Box>
    </Section>
  );
}

function PlanCard({ nome, atletas, tecnicos, preco, destaque }: { nome: string; atletas: string; tecnicos: string; preco: string; destaque: boolean }) {
  const t = useTheme();
  return (
    <Box sx={{ position: "relative", bgcolor: "background.paper", border: `1px solid ${destaque ? t.palette.primary.main : t.palette.divider}`, borderRadius: radius.outer, p: 2.75, display: "flex", flexDirection: "column", gap: 1.75, height: "100%" }}>
      {destaque && (
        <Box component="span" sx={{ position: "absolute", top: -11, left: 20, bgcolor: "primary.main", color: "primary.contrastText", fontFamily: monoFont, fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", borderRadius: radius.pill, px: 1.25, py: .375, whiteSpace: "nowrap" }}>
          SEU PLANO APÓS O TRIAL
        </Box>
      )}
      <Typography sx={{ fontFamily: monoFont, fontSize: 12, letterSpacing: ".14em", color: destaque ? "primary.main" : "text.secondary" }}>{nome}</Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: .6 }}>
        <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700 }}>{preco}</Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>/mês</Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: .75, pt: 1.5, borderTop: `1px solid ${t.palette.divider}` }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
          <Box component="span" sx={{ color: "text.secondary" }}>Atletas</Box>
          <Box component="span" sx={{ fontWeight: 500 }}>{atletas}</Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
          <Box component="span" sx={{ color: "text.secondary" }}>Técnicos</Box>
          <Box component="span" sx={{ fontWeight: 500 }}>{tecnicos}</Box>
        </Box>
      </Box>
    </Box>
  );
}

export function Pricing() {
  return (
    <Section>
      <Reveal sx={{ mb: 4.5 }}>
        <SectionMark n="07" label={C.pricing.eyebrow} />
        <SectionHeading sx={{ mt: 2, fontSize: "clamp(26px,3.4vw,34px)" }}>{C.pricing.title}</SectionHeading>
        <Typography sx={{ color: "text.secondary", fontSize: 16, mt: 2, maxWidth: "60ch" }}>{C.pricing.intro}</Typography>
        {/* Achado do pré-mortem (alto): quem lê só esta seção — sem abrir o FAQ — não pode
            ver R$99–R$599 sem saber que os primeiros 60 dias são grátis. Declarado por
            extenso aqui, não só no badge do card Basic. */}
        <Typography sx={{ fontFamily: monoFont, fontSize: 12.5, color: "primary.main", mt: 1.5 }}>{C.pricing.trialNote}</Typography>
      </Reveal>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0,1fr))" }, gap: 2 }}>
        {C.pricing.plans.map((p) => (
          <Reveal key={p.nome} sx={{ mt: p.destaque ? { xs: 0, md: 1.5 } : 0 }}>
            <PlanCard {...p} />
          </Reveal>
        ))}
      </Box>
    </Section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, px: 2.75, mb: 1.5 }}>
      <Box component="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        sx={{ width: "100%", background: "none", border: "none", color: "text.primary", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, py: 2.25, textAlign: "left", fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600 }}>
        {q}<Box component="span" sx={{ fontFamily: monoFont, color: "primary.main", fontSize: 20, flexShrink: 0, transform: open ? "rotate(45deg)" : "none", transition: "transform .28s ease" }}>+</Box>
      </Box>
      {/* `0fr → 1fr` anima a altura sem medir o conteúdo — evita max-height chutado. */}
      <Box sx={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .32s cubic-bezier(.2,.7,.2,1)", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
        <Box sx={{ overflow: "hidden" }}>
          <Typography sx={{ color: "text.secondary", fontSize: 14.5, pb: 2.5, maxWidth: "62ch" }}>{a}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function Faq() {
  return (
    <Section>
      <Container maxWidth="md" disableGutters>
        <Reveal sx={{ mb: 4.5 }}>
          <SectionMark n="08" label={C.faq.eyebrow} />
          <SectionHeading sx={{ mt: 2 }}>{C.faq.title}</SectionHeading>
        </Reveal>
        {C.faq.items.map((it) => <FaqItem key={it.q} q={it.q} a={it.a} />)}
      </Container>
    </Section>
  );
}

export function FinalCta() {
  return (
    <Section id="acesso" sx={{ position: "relative", overflow: "hidden" }}>
      <LimeAura size={900} intensity={0.18} placement="center" />
      <Container maxWidth="sm" disableGutters sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
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
