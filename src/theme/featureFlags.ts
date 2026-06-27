// Feature-flags de tema. Build-time (Vite env): o valor é substituído
// estaticamente no build, então o branch não-usado é tree-shaken.
//
// premium-v2: seleciona entre as primitivas de cor atuais e a paleta
// Premium v2.0 no createTheme. Default OFF (paleta atual).
//   Ativar: VITE_PREMIUM_V2=true npm run build
export const isPremiumV2Enabled = (): boolean =>
  import.meta.env.VITE_PREMIUM_V2 === 'true';
