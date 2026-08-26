import { describe, expect, it } from 'vitest';
import { athleteTheme } from './athleteTheme';
import { appTheme } from '../../../theme/appTheme';
import { typography as escala } from '../../../shared/design-tokens/typography';

const familia = (valor: unknown) => String(valor ?? '');
const px = (valor: unknown) => Number.parseFloat(String(valor)) * (String(valor).endsWith('rem') ? 16 : 1);

describe('athleteTheme', () => {
  describe('famílias (D3 — o shell consome font.text / font.display)', () => {
    it('o default do tema é a fonte de texto, não Syne', () => {
      expect(familia(athleteTheme.typography.fontFamily)).toMatch(/Inter/);
      expect(familia(athleteTheme.typography.fontFamily)).not.toMatch(/Syne/);
    });

    it('texto de leitura e dados em font.text', () => {
      for (const v of ['body1', 'body2', 'caption', 'overline', 'button', 'subtitle1', 'subtitle2'] as const) {
        expect(familia(athleteTheme.typography[v].fontFamily), v).toMatch(/Inter/);
      }
    });

    it('títulos em font.display (Space Grotesk primeiro)', () => {
      for (const v of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const) {
        // Syne pode ficar como fallback da pilha de display; nunca como primeira família.
        expect(familia(athleteTheme.typography[v].fontFamily), v).toMatch(/^"?Space Grotesk/);
      }
    });
  });

  describe('escala — só os 7 níveis dos tokens', () => {
    const permitidos = new Set(Object.values(escala).map((t) => Number.parseInt(t.fontSize, 10)));

    it('toda variante usa um tamanho da escala de tokens', () => {
      for (const v of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption', 'overline', 'button', 'subtitle1', 'subtitle2'] as const) {
        expect(permitidos.has(px(athleteTheme.typography[v].fontSize)), `${v} = ${String(athleteTheme.typography[v].fontSize)}`).toBe(true);
      }
    });

    it('nenhum texto funcional abaixo de 11px', () => {
      for (const v of ['caption', 'overline', 'body2', 'button'] as const) {
        expect(px(athleteTheme.typography[v].fontSize)).toBeGreaterThanOrEqual(11);
      }
    });
  });

  it('herda paleta, shape e overrides do appTheme (é aninhado, não global)', () => {
    expect(athleteTheme.palette.primary.main).toBe(appTheme.palette.primary.main);
    expect(athleteTheme.shape.borderRadius).toBe(appTheme.shape.borderRadius);
    expect(appTheme.typography.fontFamily).toMatch(/Syne/); // o global não muda
  });
});
