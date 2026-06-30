import { useState, type FormEvent } from "react";
import { Box, Checkbox, FormControlLabel, Link, TextField, Typography, useTheme, type Theme } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { CtaButton } from "./primitives";
import { faixaDeAtletas } from "./athleteRange";
import { useWaitlist } from "../hooks/useWaitlist";
import type { WaitlistInput } from "../types/Waitlist";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const mono = "'JetBrains Mono', monospace";

export function AccessForm() {
  const t = useTheme();
  const { status, error, inscrever } = useWaitlist();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [athletes, setAthletes] = useState("");
  const [aceiteLgpd, setAceiteLgpd] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<{ nome?: string; email?: string; athletes?: string }>({});

  const submitting = status === "submitting";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!nome.trim()) next.nome = "Informe seu nome.";
    if (!EMAIL_RE.test(email)) next.email = "Informe um email válido.";
    const n = Number(athletes);
    if (!athletes.trim() || !Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      next.athletes = "Quantos atletas você acompanha hoje?";
    }
    setErrors(next);
    if (Object.keys(next).length || !aceiteLgpd) return;

    const payload: WaitlistInput = {
      nome: nome.trim(),
      email: email.trim(),
      perfil: "TREINADOR",
      qtdAtletas: faixaDeAtletas(n),
      aceiteLgpd,
      website: website || undefined,
    };
    inscrever(payload);
  };

  if (status === "success") {
    return (
      <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: "16px", p: 4, maxWidth: 460, mx: "auto", textAlign: "center" }}>
        <Box sx={{ fontSize: 30, color: "primary.main" }}>✓</Box>
        <Typography variant="h3" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, my: 1 }}>Inscrição recebida</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 14.5 }}>
          Você está na lista da turma fundadora. Entramos em contato em breve — obrigado pelo interesse.
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 460, mx: "auto", textAlign: "left" }}>
      <TextField
        placeholder="Seu nome" value={nome}
        onChange={(e) => setNome(e.target.value)}
        error={!!errors.nome} helperText={errors.nome}
        fullWidth size="medium" inputProps={{ maxLength: 120, "aria-label": "Nome" }} sx={fieldSx(t)}
      />
      <TextField
        type="email" placeholder="Seu melhor email" value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={!!errors.email} helperText={errors.email}
        fullWidth size="medium" inputProps={{ maxLength: 180, "aria-label": "Email" }} sx={{ ...fieldSx(t), mt: 1.75 }}
      />
      <TextField
        type="number" placeholder="Quantos atletas você acompanha?" value={athletes}
        onChange={(e) => setAthletes(e.target.value)}
        error={!!errors.athletes} helperText={errors.athletes}
        inputProps={{ min: 1, "aria-label": "Número de atletas" }} fullWidth size="medium"
        sx={{ ...fieldSx(t), mt: 1.75 }}
      />

      {/* Honeypot anti-spam: oculto e fora da ordem de tabulação. */}
      <Box
        component="input" type="text" name="website" value={website}
        onChange={(e) => setWebsite((e.target as HTMLInputElement).value)}
        tabIndex={-1} autoComplete="off" aria-hidden="true"
        sx={{ position: "absolute", width: 1, height: 1, p: 0, m: "-1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}
      />

      <FormControlLabel
        sx={{ mt: 1.5, alignItems: "flex-start" }}
        control={<Checkbox checked={aceiteLgpd} onChange={(e) => setAceiteLgpd(e.target.checked)} disabled={submitting} size="small" />}
        label={
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            Concordo em receber contato do Menthoros e com o uso dos meus dados conforme a{" "}
            <Link component={RouterLink} to="/privacidade" underline="always">Política de Privacidade</Link>.
          </Typography>
        }
      />

      {status === "error" && (
        <Typography role="alert" sx={{ color: "error.main", fontFamily: mono, fontSize: 12.5, mt: 1.5, textAlign: "center" }}>
          {error ?? "Não foi possível enviar agora. Tente novamente."}
        </Typography>
      )}

      <Box sx={{ mt: 2.25 }}>
        <CtaButton type="submit" fullWidth disabled={submitting || !aceiteLgpd}>
          {submitting ? "Enviando…" : "Solicitar acesso →"}
        </CtaButton>
      </Box>
      <Typography sx={{ fontFamily: mono, color: "text.disabled", fontSize: 11, mt: 1.75, textAlign: "center" }}>
        Sem compromisso · vagas limitadas
      </Typography>
    </Box>
  );
}

const fieldSx = (t: Theme) => ({
  "& .MuiOutlinedInput-root": {
    bgcolor: "background.default",
    borderRadius: "10px",
    "& fieldset": { borderColor: t.palette.divider },
    "&:hover fieldset": { borderColor: t.palette.divider },
    "&.Mui-focused fieldset": { borderColor: t.palette.primary.main },
  },
  "& .MuiFormHelperText-root": { fontFamily: "'JetBrains Mono', monospace", fontSize: 12 },
});
