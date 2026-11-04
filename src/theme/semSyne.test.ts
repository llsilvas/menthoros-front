import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SRC = resolve(__dirname, '..');
// Landing e waitlist têm tema e identidade próprios (Non-goal de padronizar-tipografia-inter).
const FORA = [/^landing\//, /^pages\/landing\//, /^pages\/waitlist\//, /\.test\.tsx?$/];

function arquivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = join(dir, e.name);
    if (e.isDirectory()) return arquivos(caminho);
    return /\.tsx?$/.test(e.name) ? [caminho] : [];
  });
}

// CA4: Syne não aparece como valor em código do app logado; comentário pode citar a história.
describe('nenhum literal de Syne no app logado', () => {
  it('não há string com Syne fora da landing e da waitlist', () => {
    const achados = arquivos(SRC)
      .map((f) => relative(SRC, f))
      .filter((f) => !FORA.some((r) => r.test(f)))
      // Syne em qualquer posição de uma string, inclusive como fallback ('Inter, Syne').
      .filter((f) => /['"`][^'"`\n]*\bSyne\b/.test(readFileSync(join(SRC, f), 'utf-8')));

    expect(achados).toEqual([]);
  });
});

// CA7: a Syne deixa de ser baixada; a Inter cobre do 300 (PlanoDetalhePanel) ao 800 (títulos).
describe('fontes pedidas no index.html', () => {
  const html = readFileSync(resolve(SRC, '..', 'index.html'), 'utf-8');

  it('não pede a Syne ao Google Fonts', () => {
    expect(html).not.toMatch(/family=Syne/);
  });

  it('pede a Inter nos pesos 300 a 800', () => {
    expect(html).toMatch(/family=Inter:wght@300;400;500;600;700;800[&"]/);
  });
});
