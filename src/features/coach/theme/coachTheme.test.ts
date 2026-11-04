import { describe, expect, it } from 'vitest';
import { coachTheme, ESCALA_TIPOGRAFICA } from './coachTheme';
import { appTheme } from '../../../theme/appTheme';

const familia = (valor: unknown) => String(valor ?? '');

describe('coachTheme', () => {
  describe('famílias', () => {
    it('usa Inter em texto de leitura e dados', () => {
      expect(familia(coachTheme.typography.body1.fontFamily)).toMatch(/Inter/);
      expect(familia(coachTheme.typography.body2.fontFamily)).toMatch(/Inter/);
      expect(familia(coachTheme.typography.caption.fontFamily)).toMatch(/Inter/);
      expect(familia(coachTheme.typography.button.fontFamily)).toMatch(/Inter/);
    });

    // padronizar-tipografia-inter (CA3): títulos em Inter, mesmo tamanho de antes, peso ≥ 700.
    it.each([
      ['h1', 28],
      ['h2', 28],
      ['h3', 20],
      ['h4', 20],
    ] as const)('%s em Inter, %ipx, peso ≥ 700', (variante, tamanhoPx) => {
      const v = coachTheme.typography[variante];
      expect(familia(v.fontFamily)).toMatch(/^"?Inter/);
      expect(familia(v.fontFamily)).not.toMatch(/Syne/);
      expect(Number.parseFloat(String(v.fontSize)) * 16).toBe(tamanhoPx);
      expect(Number(v.fontWeight)).toBeGreaterThanOrEqual(700);
    });

    it('o default do tema não é mais Syne', () => {
      expect(familia(coachTheme.typography.fontFamily)).toMatch(/Inter/);
    });
  });

  describe('escala', () => {
    /** Nenhum texto funcional abaixo de 11px — o defeito nº 5 da auditoria (mínimo real: 4,8px). */
    it('nenhuma variante de texto funcional fica abaixo de 11px', () => {
      const funcionais = ['caption', 'overline', 'body1', 'body2', 'button'] as const;

      for (const variante of funcionais) {
        const tamanho = coachTheme.typography[variante].fontSize;
        expect(Number.parseFloat(String(tamanho)) * 16).toBeGreaterThanOrEqual(11);
      }
    });

    it('tem saltos reais, não uma escala comprimida', () => {
      // A auditoria mediu quase tudo entre 10 e 13px: sem contraste de tamanho não há hierarquia.
      const ordenada = [...ESCALA_TIPOGRAFICA].sort((a, b) => a - b);
      for (let i = 1; i < ordenada.length; i += 1) {
        expect(ordenada[i] / ordenada[i - 1]).toBeGreaterThanOrEqual(1.15);
      }
    });
  });

  it('herda do appTheme em vez de recriar do zero — paleta e overrides seguem os mesmos', () => {
    expect(coachTheme.palette.mode).toBe(appTheme.palette.mode);
    expect(coachTheme.shape.borderRadius).toBe(appTheme.shape.borderRadius);
  });
});
