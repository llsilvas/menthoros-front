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
  4:  'rgba(255,255,255,0.04)',
  6:  'rgba(255,255,255,0.06)',
  8:  'rgba(255,255,255,0.08)',
  10: 'rgba(255,255,255,0.10)',
  12: 'rgba(255,255,255,0.12)',
  15: 'rgba(255,255,255,0.15)',
  20: 'rgba(255,255,255,0.20)',
  25: 'rgba(255,255,255,0.25)',
  40: 'rgba(255,255,255,0.40)',
  60: 'rgba(255,255,255,0.60)',
  70: 'rgba(255,255,255,0.70)',
  80: 'rgba(255,255,255,0.80)',
} as const;

export const overlayBlack = {
  40: 'rgba(0,0,0,0.40)',
} as const;
