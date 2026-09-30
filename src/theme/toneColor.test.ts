import { describe, expect, it } from 'vitest';
import { toneColor } from './toneColor';
import { semantic, surface } from './tokens';

describe('toneColor', () => {
  it('tons de estado usam o semantic 500', () => {
    expect(toneColor('success')).toBe(semantic.success[500]);
    expect(toneColor('warning')).toBe(semantic.warning[500]);
    expect(toneColor('danger')).toBe(semantic.danger[500]);
  });

  /** O neutro depende do uso: valor em texto, marca de gráfico ou texto apagado. */
  it('neutro é texto por padrão e aceita o tom do uso', () => {
    expect(toneColor('neutral')).toBe(surface[50]);
    expect(toneColor('neutral', surface[300])).toBe(surface[300]);
    expect(toneColor('warning', surface[300])).toBe(semantic.warning[500]);
  });
});
