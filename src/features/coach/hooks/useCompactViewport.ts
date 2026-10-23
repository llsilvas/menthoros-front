import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Viewport "compacto" do coach: largura abaixo de `lg` (1200px).
 *
 * É o caso do notebook de 13"/14" e do monitor Full HD com escala de 125–150% no Windows — a
 * largura CSS cai para ~1024–1199px. O shell tratava tudo abaixo de `lg` como celular (coluna
 * única, sidebar de 240px fixa), e é nessa faixa que o coach de verdade trabalha.
 *
 * Um hook, e não `useMediaQuery` espalhado: sidebar e páginas precisam concordar sobre o que é
 * "compacto", senão a sidebar recolhe num limite e a página reorganiza em outro.
 */
export function useCompactViewport(): boolean {
  const theme = useTheme();
  // `noSsr`: o valor certo já no primeiro render, sem o frame de "não compacto" que faria a
  // sidebar abrir e recolher ao montar.
  return useMediaQuery(theme.breakpoints.down('lg'), { noSsr: true });
}
