import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Box, Button, Checkbox, FormControlLabel, Link, MenuItem, TextField, Typography, useTheme, type Theme } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { CtaButton, monoFont } from "./primitives";
import { faixaDeAtletas } from "./athleteRange";
import { validate, type AccessFormErrors } from "./accessFormValidation";
import { getUtmForSubmission } from "./utmPersistence";
import { accessSuccess, founderOffer, garminNotice } from "./content";
import { useWaitlist, type WaitlistStatus } from "../hooks/useWaitlist";
import type { PerfilWaitlist, WaitlistInput } from "../types/Waitlist";
import { radius } from "../theme/theme.premium";

export interface AccessRequestFormProps {
  /** Renderizado acima dos campos, só enquanto o status não é "success" (ex.: título do card). */
  header?: ReactNode;
  /**
   * Mostra o aviso "hoje só lemos Garmin" logo antes do envio — o último ponto de honestidade
   * antes do clique. Default `true` (caso da home, que não repete o aviso em outro lugar perto do
   * form). Em `/waitlist` a `ValueProposition` já mostra o mesmo aviso na mesma tela, sem rolagem
   * entre os dois — repeti-lo aqui também seria a mesma frase duas vezes seguidas; passe `false`.
   */
  showGarminReminder?: boolean;
  /**
   * Observa o status do envio (idle/submitting/success/error) sem tirar do componente a posse do
   * `useWaitlist()` — usado por `WaitlistPage` para decolar o preview do painel e a proposta de
   * valor quando o formulário conclui, sem duplicar o hook nem levantar o estado inteiro.
   */
  onStatusChange?: (status: WaitlistStatus) => void;
}

/**
 * Formulário único de solicitação de acesso (FE-02 da spec de conversão do Instagram,
 * 2026-10-08) — usado tanto na home (`FinalCta`) quanto em `/waitlist`. Antes eram dois
 * formulários com campos e texto de botão divergentes (`AccessForm.tsx` x o form inline de
 * `WaitlistPage.tsx`); este componente é a fonte única.
 *
 * Fora do escopo desta rodada, por dependerem de coordenação com o backend (contrato de
 * `WaitlistInput`/`PerfilWaitlist` não suporta hoje — ver CLAUDE.md "Campo de DTO em português"
 * sobre não mudar contrato só pelo front): o valor "dono de assessoria" de "Você é" (só
 * TREINADOR/ATLETA existem) e o campo "Relógio predominante dos atletas". Quando o backend
 * adotar os dois, a variante de sucesso "outra marca" de FE-05 também fica possível.
 */
export function AccessRequestForm({ header, onStatusChange, showGarminReminder = true }: AccessRequestFormProps) {
  const t = useTheme();
  const { status, error, inscrever } = useWaitlist();

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [perfil, setPerfil] = useState<PerfilWaitlist | "">("");
  const [qtdAtletasRaw, setQtdAtletasRaw] = useState("");
  const [aceiteLgpd, setAceiteLgpd] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<AccessFormErrors>({});
  const [linkCopiado, setLinkCopiado] = useState(false);

  const submitting = status === "submitting";
  const perfilEnviado = perfil || "TREINADOR";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate(nome, email, perfil, qtdAtletasRaw, aceiteLgpd);
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: WaitlistInput = {
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone.trim() || undefined,
      perfil: perfil as PerfilWaitlist,
      qtdAtletas: perfil === "TREINADOR" ? faixaDeAtletas(Number(qtdAtletasRaw)) : undefined,
      aceiteLgpd,
      website: website || undefined,
      ...getUtmForSubmission(),
    };
    inscrever(payload);
  };

  const handleCopiarLink = async () => {
    const url = `${window.location.origin}/#/waitlist`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // clipboard indisponível (permissão negada, contexto não seguro) — sem feedback de cópia;
      // o link já está visível no endereço da página para copiar manualmente.
    }
  };

  if (status === "success") {
    const sucesso = perfilEnviado === "ATLETA" ? accessSuccess.atleta : accessSuccess.treinador;
    return (
      <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, p: 4, maxWidth: 460, mx: "auto", textAlign: "center" }}>
        <Box sx={{ fontSize: 30, color: "primary.main" }}>✓</Box>
        <Typography variant="h3" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, my: 1 }}>
          {sucesso.title}
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 14.5 }}>{sucesso.body}</Typography>
        {perfilEnviado === "ATLETA" && (
          <Button onClick={handleCopiarLink} variant="outlined" sx={{ mt: 2.5 }}>
            {linkCopiado ? accessSuccess.atleta.shareCopied : accessSuccess.atleta.shareCta}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 460, mx: "auto", textAlign: "left" }}>
      {header}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: header ? 2.5 : 0 }}>
        <TextField
          label="Nome" placeholder="Seu nome" value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={!!errors.nome} helperText={errors.nome}
          fullWidth size="medium" inputProps={{ maxLength: 120 }} sx={fieldSx(t)}
        />
        <TextField
          type="email" label="Email" placeholder="Seu melhor email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!errors.email} helperText={errors.email}
          fullWidth size="medium" inputProps={{ maxLength: 180 }} sx={{ ...fieldSx(t), mt: 1.75 }}
        />
        <TextField
          label="Telefone / WhatsApp (opcional)" placeholder="(11) 99999-9999" value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          fullWidth size="medium" inputProps={{ maxLength: 20 }} sx={{ ...fieldSx(t), mt: 1.75 }}
        />
        <TextField
          select label="Você é" value={perfil}
          onChange={(e) => setPerfil(e.target.value as PerfilWaitlist)}
          error={!!errors.perfil} helperText={errors.perfil}
          fullWidth size="medium" sx={{ ...fieldSx(t), mt: 1.75 }}
        >
          <MenuItem value="TREINADOR">Treinador(a)</MenuItem>
          <MenuItem value="ATLETA">Atleta</MenuItem>
        </TextField>

        {perfil === "TREINADOR" && (
          <TextField
            type="number" label="Número de atletas" placeholder="Quantos atletas você acompanha?" value={qtdAtletasRaw}
            onChange={(e) => setQtdAtletasRaw(e.target.value)}
            error={!!errors.qtdAtletas} helperText={errors.qtdAtletas}
            inputProps={{ min: 1 }} fullWidth size="medium"
            sx={{ ...fieldSx(t), mt: 1.75 }}
          />
        )}

        {/* Último ponto de honestidade antes do envio: hoje só Garmin está integrado. */}
        {showGarminReminder && (
          <Typography sx={{ fontSize: 12.5, color: "text.secondary", lineHeight: 1.4, mt: 1.5 }}>
            {garminNotice.pre}
            <Box component="strong" sx={{ color: "text.primary" }}>{garminNotice.brand}</Box>
            {garminNotice.post}
          </Typography>
        )}

        {/* Honeypot anti-spam: oculto e fora da ordem de tabulação. */}
        <input
          type="text" name="website" value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}
        />

        {/* Link fora do <label> de propósito: um <label> encaminha qualquer clique interno para o
            controle associado (o checkbox) — comportamento nativo do browser, não bug de React,
            e `stopPropagation` não resolve (mesmo padrão de CoachConsentDialog.tsx; ver CLAUDE.md
            do front). A frase do checkbox fica autocontida, sem link embutido; o link vive numa
            linha própria, sempre alinhado, nunca deslocado por onde o texto quebra. */}
        <FormControlLabel
          sx={{ mt: 1.5, alignItems: "flex-start" }}
          control={
            <Checkbox
              checked={aceiteLgpd}
              onChange={(e) => {
                setAceiteLgpd(e.target.checked);
                if (e.target.checked) {
                  setErrors((prev) => {
                    if (!prev.aceiteLgpd) return prev;
                    const next = { ...prev };
                    delete next.aceiteLgpd;
                    return next;
                  });
                }
              }}
              disabled={submitting}
              size="small"
            />
          }
          label={
            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
              Concordo em receber comunicações do Menthoros sobre o acesso ao beta e com o uso dos meus dados pessoais.
            </Typography>
          }
        />
        <Link component={RouterLink} to="/privacidade" underline="always" sx={{ fontSize: 13, display: "inline-block", ml: 4.5, mt: -.5 }}>
          Ler a Política de Privacidade
        </Link>
        {errors.aceiteLgpd && (
          <Typography sx={{ color: "error.main", fontFamily: monoFont, fontSize: 11.5, mt: .5 }}>
            {errors.aceiteLgpd}
          </Typography>
        )}

        {status === "error" && (
          <Typography role="alert" sx={{ color: "error.main", fontFamily: monoFont, fontSize: 12.5, mt: 1.5, textAlign: "center" }}>
            {error ?? "Não foi possível enviar agora. Tente novamente."}
          </Typography>
        )}

        <Box sx={{ mt: 2.25 }}>
          <CtaButton type="submit" fullWidth disabled={submitting}>
            {submitting ? "Enviando…" : "Solicitar acesso"}
          </CtaButton>
        </Box>
        <Typography sx={{ fontFamily: monoFont, color: "text.secondary", fontSize: 11, mt: 1.75, textAlign: "center" }}>
          Sem compromisso · 60 dias grátis, sem cartão · {founderOffer.vagas} vagas no programa fundador
        </Typography>
        <Typography sx={{ fontFamily: monoFont, color: "text.secondary", fontSize: 11, mt: .5, textAlign: "center" }}>
          Continuidade mediante contratação, ao fim do teste
        </Typography>
      </Box>
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
