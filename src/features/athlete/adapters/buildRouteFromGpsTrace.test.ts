import { describe, expect, it } from 'vitest';
import { buildRouteFromGpsTrace, decodePolyline, type LatLng } from './buildRouteFromGpsTrace';

const coords = (d: string) => d.replace(/[ML]/g, '').trim().split(/\s+/).map(Number);

describe('decodePolyline', () => {
  it('decodifica o exemplo de referência do Google', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      [38.5, -120.2], [40.7, -120.95], [43.252, -126.453],
    ]);
  });

  it('string vazia → lista vazia', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});

describe('buildRouteFromGpsTrace (CA5)', () => {
  // Retângulo de ~1 km × 0,5 km em São Paulo (lat -23,5).
  const sp: LatLng[] = [[-23.5, -46.6], [-23.5, -46.59], [-23.495, -46.59], [-23.495, -46.6]];

  it('começa e termina nos pontos reais do trajeto', () => {
    const g = buildRouteFromGpsTrace(sp, 300, 300)!;
    const nums = coords(g.d);
    expect([nums[0], nums[1]]).toEqual(g.inicio);
    expect([nums[nums.length - 2], nums[nums.length - 1]]).toEqual(g.fim);
  });

  it('mantém a proporção com correção cos(lat) — tolerância 1%', () => {
    const g = buildRouteFromGpsTrace(sp, 300, 300)!;
    const nums = coords(g.d);
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const razaoDesenho = (Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys));
    const razaoReal = (0.01 * Math.cos((-23.4975 * Math.PI) / 180)) / 0.005;
    expect(Math.abs(razaoDesenho / razaoReal - 1)).toBeLessThan(0.01);
  });

  it('cabe no viewBox com margem', () => {
    const nums = coords(buildRouteFromGpsTrace(sp, 300, 200)!.d);
    nums.forEach((v, i) => {
      expect(v).toBeGreaterThanOrEqual(i % 2 === 0 ? 300 * 0.08 - 0.1 : 0);
      expect(v).toBeLessThanOrEqual(i % 2 === 0 ? 300 : 200 * 0.92 + 0.1);
    });
  });

  it('trajeto reto (só norte-sul) não gera NaN e fica centralizado na horizontal', () => {
    const g = buildRouteFromGpsTrace([[-23.5, -46.6], [-23.49, -46.6]], 300, 300)!;
    expect(g.d).not.toContain('NaN');
    expect(g.inicio[0]).toBe(150);
  });

  it('pontos coincidentes viram um ponto no centro, sem NaN nem Infinity', () => {
    const g = buildRouteFromGpsTrace([[-23.5, -46.6], [-23.5, -46.6]], 300, 200)!;
    expect(g.inicio).toEqual([150, 100]);
    expect(g.d).not.toMatch(/NaN|Infinity/);
  });

  it('menos de 2 pontos → null', () => {
    expect(buildRouteFromGpsTrace([[-23.5, -46.6]], 300, 300)).toBeNull();
    expect(buildRouteFromGpsTrace([], 300, 300)).toBeNull();
  });
});
