// Overlays neutros sobre canvas escuro — branco/preto por opacidade.
//
// Não-semânticos: bordas hairline, fundos de hover/seleção translúcidos e textos
// esmaecidos que não pertencem a nenhuma escala de marca/estado. Centralizar aqui
// tira o rgba() raw dos componentes sem inflar `content`/`glass` (que são
// semânticos: card, input, divider). Valores idênticos nos dois estados da
// feature-flag premium-v2 — overlay não muda entre paletas.
//
// Camada de tema (theme/**): rgba raw é legítimo aqui; componentes consomem o token.
export const overlayWhite = {
  2:  'rgba(255,255,255,0.02)',
  4:  'rgba(255,255,255,0.04)',
  5:  'rgba(255,255,255,0.05)',
  6:  'rgba(255,255,255,0.06)',
  7:  'rgba(255,255,255,0.07)',
  8:  'rgba(255,255,255,0.08)',
  10: 'rgba(255,255,255,0.10)',
  12: 'rgba(255,255,255,0.12)',
  15: 'rgba(255,255,255,0.15)',
  20: 'rgba(255,255,255,0.20)',
  22: 'rgba(255,255,255,0.22)',
  25: 'rgba(255,255,255,0.25)',
  30: 'rgba(255,255,255,0.30)',
  40: 'rgba(255,255,255,0.40)',
  45: 'rgba(255,255,255,0.45)',
  50: 'rgba(255,255,255,0.50)',
  55: 'rgba(255,255,255,0.55)',
  60: 'rgba(255,255,255,0.60)',
  70: 'rgba(255,255,255,0.70)',
  80: 'rgba(255,255,255,0.80)',
} as const;

export const overlayBlack = {
  10: 'rgba(0,0,0,0.10)',
  15: 'rgba(0,0,0,0.15)',
  25: 'rgba(0,0,0,0.25)',
  40: 'rgba(0,0,0,0.40)',
} as const;

// Máscara da grade de fundo da landing (GridBackdrop): apaga as bordas do
// viewport para a textura não virar papel de parede. Não é cor pintada — só o
// canal alfa importa —, mas o literal mora aqui porque a regra de lint reserva
// cor raw à camada de tema.
export const gridFadeMask =
  'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(0,0,0,1) 40%, transparent 100%)';
