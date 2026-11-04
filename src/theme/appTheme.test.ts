import { describe, expect, it } from 'vitest';
import { appTheme } from './appTheme';
import { font } from './theme.premium';

const familia = (valor: unknown) => String(valor ?? '');
const TITULOS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

// padronizar-tipografia-inter: o app logado inteiro em Inter, títulos inclusive (CA2).
describe('appTheme — tipografia', () => {
  it('a família padrão começa por Inter', () => {
    expect(familia(appTheme.typography.fontFamily)).toMatch(/^"?Inter/);
  });

  it('títulos h1–h6 em Inter, sem Syne na pilha', () => {
    for (const v of TITULOS) {
      expect(familia(appTheme.typography[v].fontFamily), v).toMatch(/^"?Inter/);
      expect(familia(appTheme.typography[v].fontFamily), v).not.toMatch(/Syne/);
    }
  });

  it('hierarquia por peso: títulos nunca abaixo de 600', () => {
    for (const v of TITULOS) {
      expect(Number(appTheme.typography[v].fontWeight), v).toBeGreaterThanOrEqual(600);
    }
  });

  it('font.display também é Inter, sem Syne nem Space Grotesk', () => {
    expect(font.display).toMatch(/^"?Inter/);
    expect(font.display).not.toMatch(/Syne|Space Grotesk/);
  });
});
