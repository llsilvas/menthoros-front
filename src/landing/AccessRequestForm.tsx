import { useEffect, useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Box, Button, Checkbox, FormControlLabel, InputBase, Link, NativeSelect, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { CtaButton, monoFont } from "./primitives";
import { faixaDeAtletas } from "./athleteRange";
import { validate, type AccessFormErrors } from "./accessFormValidation";
import { getUtmForSubmission } from "./utmPersistence";
import { accessSuccess, founderOffer, garminNotice } from "./content";
import { useWaitlist, type WaitlistStatus } from "../hooks/useWaitlist";
import type { PerfilWaitlist, WaitlistInput } from "../types/Waitlist";
import { radius, surface, surfaceShift } from "../theme/theme.premium";

export interface AccessRequestFormProps {
  /** Renderizado acima dos campos, só enquanto o status não é "success" (ex.: título do card). */
  header?: ReactNode;
  /**
   * Formulário dentro de um card que a página já desenha, numa página que já mostra a oferta e o
   * aviso de Garmin logo acima (`/waitlist`): ocupa a largura do card, sem moldura própria no
   * sucesso, e sem repetir aviso de Garmin nem rodapé de condições. Sem `compact` (home), o
   * formulário é autônomo e traz esses dois pontos de honestidade junto do botão.
   */
  compact?: boolean;
  /**
   * Observa o status do envio (idle/submitting/success/error) sem tirar do componente a posse do
   * `useWaitlist()` — usado por `WaitlistPage` para esconder o preview do painel e a proposta de
   * valor quando o formulário conclui, sem duplicar o hook nem levantar o estado inteiro.
   */
  onStatusChange?: (status: WaitlistStatus) => void;
}

const inputSx = {
  width: "100%",
  bgcolor: surfaceShift.panel,
  border: `1px solid ${surface[700]}`,
  borderRadius: "6px",
  color: "text.primary",
  fontSize: 13.5,
  transition: "border-color .15s ease",
  "& .MuiInputBase-input, & .MuiNativeSelect-select": { px: "11px", py: "9px", height: "auto", lineHeight: 1.2 },
  "& .MuiInputBase-input::placeholder": { color: "text.disabled", opacity: 1 },
  "&.Mui-focused": { borderColor: "primary.main" },
  "&.Mui-error": { borderColor: "error.main" },
} as const;

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <Box component="label" htmlFor={id} sx={{ fontSize: 12, fontWeight: 500, color: "text.secondary" }}>
        {label}
        {/* fora do nome acessível: o campo continua "Nome", não "Nome *" — o obrigatório é informado
            pela validação e pela mensagem de erro do próprio campo. */}
        {required && <span aria-hidden="true"> *</span>}
      </Box>
      {children}
      {error && (
        <Typography id={`${id}-erro`} sx={{ color: "error.main", fontFamily: monoFont, fontSize: 11.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Formulário único de solicitação de acesso (FE-02 da spec de conversão do Instagram,
 * 2026-10-08) — usado tanto na home (`FinalCta`) quanto em `/waitlist`. Antes eram dois
 * formulários com campos e texto de botão divergentes (`AccessForm.tsx` x o form inline de
 * `WaitlistPage.tsx`); este componente é a fonte única. Visual segue o artboard "Formulário" do
 * protótipo aprovado: rótulo acima de campo compacto, seleção nativa.
 *
 * Fora do escopo desta rodada, por dependerem de coordenação com o backend (contrato de
 * `WaitlistInput`/`PerfilWaitlist` não suporta hoje — ver CLAUDE.md "Campo de DTO em português"
 * sobre não mudar contrato só pelo front): o valor "dono de assessoria" de "Você é" (só
 * TREINADOR/ATLETA existem) e o campo "Relógio predominante dos atletas". Quando o backend
 * adotar os dois, a variante de sucesso "outra marca" de FE-05 também fica possível.
 */
export function AccessRequestForm({ header, onStatusChange, compact = false }: AccessRequestFormProps) {
  const t = useTheme();
  const { status, error, inscrever } = useWaitlist();
  const uid = useId();
  const ids = { nome: `${uid}-nome`, email: `${uid}-email`, telefone: `${uid}-telefone`, perfil: `${uid}-perfil`, qtd: `${uid}-qtd` };

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

  const describedBy = (id: string, err?: string) => (err ? { "aria-describedby": `${id}-erro` } : {});

  if (status === "success") {
    const sucesso = perfilEnviado === "ATLETA" ? accessSuccess.atleta : accessSuccess.treinador;
    const frame = compact
      ? { py: 2 }
      : { bgcolor: "background.paper", border: `1px solid ${t.palette.divider}`, borderRadius: radius.outer, p: 4, maxWidth: 460, mx: "auto" };
    return (
      <Box sx={{ ...frame, textAlign: "center" }}>
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
    <Box sx={{ maxWidth: compact ? "none" : 460, mx: "auto", textAlign: "left" }}>
      {header}
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: header ? "14px" : 0, display: "flex", flexDirection: "column", gap: "12px" }}>
        <Field id={ids.nome} label="Nome" required error={errors.nome}>
          <InputBase
            id={ids.nome} value={nome} placeholder="Seu nome completo" error={!!errors.nome}
            onChange={(e) => setNome(e.target.value)}
            inputProps={{ maxLength: 120, ...describedBy(ids.nome, errors.nome) }} sx={inputSx}
          />
        </Field>
        <Field id={ids.email} label="E-mail" required error={errors.email}>
          <InputBase
            id={ids.email} type="email" value={email} placeholder="voce@exemplo.com" error={!!errors.email}
            onChange={(e) => setEmail(e.target.value)}
            inputProps={{ maxLength: 180, ...describedBy(ids.email, errors.email) }} sx={inputSx}
          />
        </Field>
        <Field id={ids.telefone} label="WhatsApp (opcional)">
          <InputBase
            id={ids.telefone} type="tel" value={telefone} placeholder="(11) 99999-9999"
            onChange={(e) => setTelefone(e.target.value)}
            inputProps={{ maxLength: 20 }} sx={inputSx}
          />
        </Field>
        <Field id={ids.perfil} label="Você é" required error={errors.perfil}>
          <NativeSelect
            value={perfil} error={!!errors.perfil}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setPerfil(e.target.value as PerfilWaitlist | "")}
            input={<InputBase sx={inputSx} />}
            inputProps={{ id: ids.perfil, ...describedBy(ids.perfil, errors.perfil) }}
          >
            <option value="" disabled>Selecione uma opção</option>
            <option value="TREINADOR">Treinador</option>
            <option value="ATLETA">Atleta</option>
          </NativeSelect>
        </Field>

        {perfil === "TREINADOR" && (
          <Field id={ids.qtd} label="Número de atletas" required error={errors.qtdAtletas}>
            <InputBase
              id={ids.qtd} type="number" value={qtdAtletasRaw} placeholder="Ex.: 12" error={!!errors.qtdAtletas}
              onChange={(e) => setQtdAtletasRaw(e.target.value)}
              inputProps={{ min: 1, ...describedBy(ids.qtd, errors.qtdAtletas) }} sx={inputSx}
            />
          </Field>
        )}

        {/* Último ponto de honestidade antes do envio: hoje só Garmin está integrado. */}
        {!compact && (
          <Typography sx={{ fontSize: 12.5, color: "text.secondary", lineHeight: 1.4 }}>
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
            do front). O link vive numa linha própria, alinhado ao texto do consentimento. */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", mt: "2px" }}>
          <FormControlLabel
            sx={{ m: 0, alignItems: "flex-start", gap: "9px" }}
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
                sx={{ p: 0, mt: "1px", "& .MuiSvgIcon-root": { fontSize: 18 } }}
              />
            }
            label={
              <Typography sx={{ color: "text.secondary", fontSize: 11.5, lineHeight: 1.45 }}>
                Concordo em receber comunicações do Menthoros sobre o acesso ao beta e com o uso dos meus dados pessoais.
              </Typography>
            }
          />
          <Link component={RouterLink} to="/privacidade" underline="always" sx={{ fontSize: 11.5, ml: "27px", alignSelf: "flex-start" }}>
            Ler a Política de Privacidade
          </Link>
          {errors.aceiteLgpd && (
            <Typography sx={{ color: "error.main", fontFamily: monoFont, fontSize: 11.5, ml: "27px" }}>
              {errors.aceiteLgpd}
            </Typography>
          )}
        </Box>

        {status === "error" && (
          <Typography role="alert" sx={{ color: "error.main", fontFamily: monoFont, fontSize: 12.5, textAlign: "center" }}>
            {error ?? "Não foi possível enviar agora. Tente novamente."}
          </Typography>
        )}

        <Box sx={{ mt: "4px" }}>
          <CtaButton type="submit" fullWidth disabled={submitting}>
            {submitting ? "Enviando…" : "Solicitar acesso"}
          </CtaButton>
        </Box>
        {!compact && (
          <Box>
            <Typography sx={{ fontFamily: monoFont, color: "text.secondary", fontSize: 11, textAlign: "center" }}>
              Sem compromisso · 60 dias grátis, sem cartão · {founderOffer.vagas} vagas no programa fundador
            </Typography>
            <Typography sx={{ fontFamily: monoFont, color: "text.secondary", fontSize: 11, mt: .5, textAlign: "center" }}>
              Continuidade mediante contratação, ao fim do teste
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
