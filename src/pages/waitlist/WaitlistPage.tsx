import { useState } from 'react';
import { Box, Paper, ThemeProvider, Typography } from '@mui/material';
import { AccessRequestForm } from '../../landing/AccessRequestForm';
import { ValueProposition } from '../../landing/ValueProposition';
import { foundersSlotsLabel } from '../../landing/foundersSlotsCopy';
import { QueuePreview } from '../../landing/ProductUI';
import landingTheme from '../../theme/landingTheme';
import { radius, surface } from '../../theme/theme.premium';
import { useFoundersSlots } from '../../hooks/useFoundersSlots';
import type { WaitlistStatus } from '../../hooks/useWaitlist';

/**
 * Página de destino do link da bio (FE-01 da spec de conversão do Instagram, 2026-10-08). Layout,
 * medidas e componentes seguem o protótipo aprovado no canvas de design: proposta de valor no
 * topo; abaixo, painel e formulário lado a lado dividindo a largura (painel à esquerda), e no
 * mobile o formulário vem antes do painel para ficar visível sem rolar mais de uma tela.
 *
 * O espaço entre os cards é `gap`, não o `spacing` do Stack: os cards usam `order` para inverter
 * a ordem no mobile, e o `spacing` aplica margem pela ordem do DOM — com `order` a margem caía
 * no lado errado e os cards ficavam colados.
 */
export default function WaitlistPage() {
  const [status, setStatus] = useState<WaitlistStatus>('idle');
  const concluido = status === 'success';
  const slots = useFoundersSlots();
  const tituloVagas = foundersSlotsLabel(slots, {
    baseLabel: 'Turma fundadora',
    openLabel: 'Turma fundadora — Restam {remaining} de {total} vagas',
    closedLabel: 'Lista de espera — próxima turma',
  });

  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'background.default',
          px: { xs: 2, sm: 4 },
          py: { xs: 3, sm: 5 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1040, display: 'flex', flexDirection: 'column', gap: { xs: '18px', sm: '28px' } }}>
          {!concluido && <ValueProposition />}

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'flex-start' },
              gap: { xs: '18px', md: '24px' },
            }}
          >
            {!concluido && (
              <Box sx={{ order: { xs: 2, md: 1 }, flex: { md: '1 1 440px' }, minWidth: 0 }}>
                <QueuePreview />
              </Box>
            )}

            <Paper
              elevation={0}
              sx={{
                order: { xs: 1, md: 2 },
                flex: { md: '1 1 400px' },
                minWidth: 0,
                width: '100%',
                maxWidth: concluido ? 480 : 'none',
                mx: concluido ? 'auto' : 0,
                bgcolor: 'background.paper',
                border: `1px solid ${surface[700]}`,
                borderRadius: radius.inner,
                p: '20px',
              }}
            >
              <AccessRequestForm
                compact
                onStatusChange={setStatus}
                header={
                  <Box>
                    <Typography
                      component="h2"
                      sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: 'text.primary', mb: '4px' }}
                    >
                      {tituloVagas}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, lineHeight: 1.5, color: 'text.secondary' }}>
                      Treinadores testando o Menthoros antes do lançamento. Preencha para reservar a sua.
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
