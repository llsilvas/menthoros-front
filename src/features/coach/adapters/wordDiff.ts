export type DiffToken = { type: 'same' | 'added' | 'removed'; text: string };

/** Teto por lado: o LCS é O(n·m) e o texto vem de input livre; acima disso o chamador mostra os dois textos sem destaque. */
export const WORD_DIFF_MAX_TOKENS = 200;

/** Diff por palavra (LCS) entre o texto original e o atual; `null` se algum lado passa do teto. */
export function wordDiff(original: string, atual: string): DiffToken[] | null {
  const a = original.split(/\s+/).filter(Boolean);
  const b = atual.split(/\s+/).filter(Boolean);
  if (a.length > WORD_DIFF_MAX_TOKENS || b.length > WORD_DIFF_MAX_TOKENS) return null;

  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      tokens.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      tokens.push({ type: 'removed', text: a[i++] });
    } else {
      tokens.push({ type: 'added', text: b[j++] });
    }
  }
  while (i < a.length) tokens.push({ type: 'removed', text: a[i++] });
  while (j < b.length) tokens.push({ type: 'added', text: b[j++] });
  return tokens;
}
