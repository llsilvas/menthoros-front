import { useState } from 'react';
import { Box, Paper, Stack, Typography, ThemeProvider, useTheme } from '@mui/material';
import { AccessRequestForm } from '../../landing/AccessRequestForm';
import { ValueProposition } from '../../landing/ValueProposition';
import { founderOffer } from '../../landing/content';
import { AttentionQueue } from '../../landing/ProductUI';
import landingTheme from '../../theme/landingTheme';
import { radius } from '../../theme/theme.premium';
import type { WaitlistStatus } from '../../hooks/useWaitlist';
import { gradients, surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';

/**
 * Formulário e campos do antigo header de "Turma fundadora" foram extraídos para
 * `AccessRequestForm.tsx` (FE-02) e `ValueProposition.tsx` (FE-01) — fonte única compartilhada
 * com a home, ver `content.ts`. Esta página só monta o layout (painel ao lado do formulário no
 * desktop, abaixo no mobile — `order` abaixo) e o card de oferta fundadora que envolve o form.
 *
 * Os dois cards (painel e formulário) usam o MESMO tratamento — fundo plano `surfaceShift.card`,
 * borda `divider`, `radius.outer` — de propósito: o design system documenta o material de vidro
 * (blur) como exceção, não padrão, e o card do formulário usava `glassAzulSx` (vidro translúcido)
 * enquanto o painel era plano, o que os fazia parecer dois sistemas visuais diferentes lado a lado.
 */
function WaitlistContent() {
  const t = useTheme();
  const [status, setStatus] = useState<WaitlistStatus>('idle');
  const concluido = status === 'success';

  const cardSx = {
    bgcolor: "background.paper",
    border: `1px solid ${t.palette.divider}`,
    borderRadius: radius.outer,
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        p: 2,
        py: { xs: 3, md: 6 },
        background: gradients.background,
      }}
    >
      <Stack sx={{ width: '100%', maxWidth: 1040, mx: 'auto', gap: { xs: 3, md: 4 } }}>
        {!concluido && <ValueProposition />}

        {/* `gap` em vez do prop `spacing` do Stack: `spacing` aplica margem por ordem de DOM, mas
            os cards usam `order` (CSS) pra inverter painel/formulário no mobile sem duplicar JSX —
            margem por ordem de DOM não acompanha `order` visual, e o espaço entre os cards sumia
            (ambos ficavam colados, a margem ia pro lado errado). `gap` não depende de ordem. */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
          justifyContent="center"
          sx={{ gap: { xs: 3, md: 5 } }}
        >
          <Paper
            elevation={0}
            sx={{
              order: { xs: 1, md: 2 },
              width: { xs: '100%', md: 480 },
              flexShrink: 0,
              maxWidth: 480,
              mx: { xs: 'auto', md: 0 },
              p: { xs: 2.5, sm: 3 },
              ...cardSx,
            }}
          >
            <AccessRequestForm
              onStatusChange={setStatus}
              showGarminReminder={false}
              header={
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: surface[0], mb: 0.5 }}>
                    Turma fundadora — {founderOffer.vagas} vagas
                  </Typography>
                  <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
                    Treinadores testando o Menthoros antes do lançamento. Preencha para reservar a sua.
                  </Typography>
                </Box>
              }
            />
          </Paper>

          {!concluido && (
            <Box
              sx={{
                order: { xs: 2, md: 1 },
                width: { xs: '100%', md: 420 },
                flexShrink: 0,
                maxWidth: 420,
                mx: { xs: 'auto', md: 0 },
              }}
            >
              <AttentionQueue />
            </Box>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default function WaitlistPage() {
  return (
    <ThemeProvider theme={landingTheme}>
      <WaitlistContent />
    </ThemeProvider>
  );
}
