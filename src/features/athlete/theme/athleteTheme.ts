import { createTheme } from '@mui/material/styles';
import { appTheme } from '../../../theme/appTheme';
import { activeTheme } from '../../../theme/activeTheme';
import { typography as escala } from '../../../shared/design-tokens/typography';

const { text: TEXTO, display: DISPLAY } = activeTheme.font;

const rem = (px: string) => `${Number.parseInt(px, 10) / 16}rem`;

/**
 * Tema do shell do atleta — **aninhado** no `AthleteLayout`, nunca global (precedente:
 * `features/coach/theme/coachTheme.ts`).
 *
 * `appTheme` declara Syne como família padrão e o `index.html` só carrega Syne 700/800: todo texto
 * do shell saía em display bold, enquanto `font.text` (Inter) existia como token sem consumidor.
 * Aqui texto e dados usam `font.text`; títulos, `font.display`. Os tamanhos são só os sete níveis
 * de `shared/design-tokens/typography` — nada de `0.82rem`.
 */
export const athleteTheme = createTheme(appTheme, {
  typography: {
    fontFamily: TEXTO,
    h1: { fontFamily: DISPLAY, fontSize: rem(escala.display.fontSize), lineHeight: escala.display.lineHeight, fontWeight: 700 },
    h2: { fontFamily: DISPLAY, fontSize: rem(escala.display.fontSize), lineHeight: escala.display.lineHeight, fontWeight: 700 },
    h3: { fontFamily: DISPLAY, fontSize: rem(escala['2xl'].fontSize), lineHeight: escala['2xl'].lineHeight, fontWeight: 700 },
    h4: { fontFamily: DISPLAY, fontSize: rem(escala['2xl'].fontSize), lineHeight: escala['2xl'].lineHeight, fontWeight: 700 },
    h5: { fontFamily: DISPLAY, fontSize: rem(escala.xl.fontSize), lineHeight: escala.xl.lineHeight, fontWeight: 600 },
    h6: { fontFamily: DISPLAY, fontSize: rem(escala.lg.fontSize), lineHeight: escala.lg.lineHeight, fontWeight: 600 },
    subtitle1: { fontFamily: TEXTO, fontSize: rem(escala.lg.fontSize), lineHeight: escala.lg.lineHeight, fontWeight: 500 },
    subtitle2: { fontFamily: TEXTO, fontSize: rem(escala.base.fontSize), lineHeight: escala.base.lineHeight, fontWeight: 500 },
    body1: { fontFamily: TEXTO, fontSize: rem(escala.base.fontSize), lineHeight: escala.base.lineHeight },
    body2: { fontFamily: TEXTO, fontSize: rem(escala.sm.fontSize), lineHeight: escala.sm.lineHeight },
    button: { fontFamily: TEXTO, fontSize: rem(escala.base.fontSize), fontWeight: 600, textTransform: 'none' },
    caption: { fontFamily: TEXTO, fontSize: rem(escala.xs.fontSize), lineHeight: escala.xs.lineHeight },
    overline: { fontFamily: TEXTO, fontSize: rem(escala.xs.fontSize), letterSpacing: '0.06em', fontWeight: 600 },
  },
});

export default athleteTheme;
