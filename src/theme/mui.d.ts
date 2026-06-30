import '@mui/material/styles';

// Augmentation global do Palette do MUI: `surfaceShift` (elevação por shift de cor) usado pela
// landing premium. Em .d.ts dedicado para ser incluído incondicionalmente pelo tsconfig — não
// depende de `landingTheme.ts` estar no grafo de importações.
declare module '@mui/material/styles' {
  interface Palette {
    surfaceShift: { panel: string; card: string; raised: string };
  }
  interface PaletteOptions {
    surfaceShift?: { panel: string; card: string; raised: string };
  }
}
