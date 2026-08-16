import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { coachTheme, ESCALA_TIPOGRAFICA } from './coachTheme';
import { appTheme } from '../../../theme/appTheme';

const familia = (valor: unknown) => String(valor ?? '');

describe('coachTheme', () => {
  describe('famílias', () => {
    /** Syne é display: boa em título curto, ruim em label e número, que é o grosso desta tela. */
    it('usa Inter em texto de leitura e dados', () => {
      expect(familia(coachTheme.typography.body1.fontFamily)).toMatch(/Inter/);
      expect(familia(coachTheme.typography.body2.fontFamily)).toMatch(/Inter/);
      expect(familia(coachTheme.typography.caption.fontFamily)).toMatch(/Inter/);
      expect(familia(coachTheme.typography.button.fontFamily)).toMatch(/Inter/);
    });

    it('mantém Syne nos títulos', () => {
      expect(familia(coachTheme.typography.h3.fontFamily)).toMatch(/Syne/);
      expect(familia(coachTheme.typography.h4.fontFamily)).toMatch(/Syne/);
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

  /**
   * O Non-Goal da change é explícito: não mexer nas telas do atleta. Como `App.tsx` envolve TODAS
   * as rotas num único `ThemeProvider` e `AthleteLayout` não tem provider próprio, qualquer
   * alteração de `typography` lá vazaria para o atleta. Este teste falha se alguém tentar.
   */
  it('não altera a tipografia global — o tema do app segue com Syne como família padrão', () => {
    const global = readFileSync(resolve(__dirname, '../../../theme/appTheme.ts'), 'utf-8');

    expect(global).toContain('fontFamily: \'"Syne", "Inter", "Helvetica", "Arial", sans-serif\'');
    // E o tema do coach herda dele, em vez de recriar do zero — paleta e overrides seguem os mesmos.
    expect(coachTheme.palette.mode).toBe(appTheme.palette.mode);
    expect(coachTheme.shape.borderRadius).toBe(appTheme.shape.borderRadius);
  });
});
