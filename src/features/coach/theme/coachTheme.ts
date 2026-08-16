import { createTheme } from '@mui/material/styles';
import { appTheme } from '../../../theme/appTheme';

const INTER = '"Inter", "Helvetica", "Arial", sans-serif';
const SYNE = '"Syne", "Inter", "Helvetica", "Arial", sans-serif';

/**
 * Degraus em px. Saltos de ~1,25× para haver hierarquia perceptível: a auditoria mediu quase toda a
 * tela entre 10 e 13px, faixa em que nada se destaca de nada.
 */
export const ESCALA_TIPOGRAFICA = [11, 13, 16, 20, 28] as const;

const px = (valor: number) => `${valor / 16}rem`;

/**
 * Tema do shell do coach — **aninhado**, nunca global.
 *
 * `App.tsx` envolve todas as rotas num único `ThemeProvider` e declara Syne como família padrão;
 * `AthleteLayout` não tem provider próprio. Mudar a tipografia lá alteraria as telas do atleta, que
 * o Non-Goal desta change proíbe explicitamente. Um `ThemeProvider` aninhado no `CoachLayout` herda
 * tudo (paleta, shape, overrides de componente) e sobrepõe só o que precisa.
 *
 * Syne é display: funciona em título curto e mal em label, número e texto corrido — que é o grosso
 * de uma tela de triagem. Por isso vira exceção, não regra.
 */
export const coachTheme = createTheme(appTheme, {
  typography: {
    fontFamily: INTER,
    h1: { fontFamily: SYNE, fontSize: px(28), fontWeight: 800 },
    h2: { fontFamily: SYNE, fontSize: px(28), fontWeight: 800 },
    h3: { fontFamily: SYNE, fontSize: px(20), fontWeight: 800 },
    h4: { fontFamily: SYNE, fontSize: px(20), fontWeight: 700 },
    h5: { fontFamily: INTER, fontSize: px(16), fontWeight: 700 },
    h6: { fontFamily: INTER, fontSize: px(16), fontWeight: 700 },
    body1: { fontFamily: INTER, fontSize: px(16) },
    body2: { fontFamily: INTER, fontSize: px(13) },
    button: { fontFamily: INTER, fontSize: px(13), textTransform: 'none' },
    caption: { fontFamily: INTER, fontSize: px(11) },
    overline: { fontFamily: INTER, fontSize: px(11), letterSpacing: '0.08em' },
  },
});

export default coachTheme;
