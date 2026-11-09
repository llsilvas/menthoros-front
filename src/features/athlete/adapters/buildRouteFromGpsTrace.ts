/** Ponto decodificado do trajeto: [latitude, longitude] em graus. */
export type LatLng = [number, number];

export interface RouteGeometry {
  /** Atributo `d` do `<path>` SVG no viewBox pedido. */
  d: string;
  inicio: [number, number];
  fim: [number, number];
}

/** Decodifica uma polyline do Google (precisão 5) — mesmo formato que o backend grava (`GpsTraceCodec`). */
export function decodePolyline(encoded: string): LatLng[] {
  const pontos: LatLng[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const proximo = () => {
    let resultado = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(i++) - 63;
      resultado |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return resultado & 1 ? ~(resultado >> 1) : resultado >> 1;
  };
  while (i < encoded.length) {
    lat += proximo();
    lng += proximo();
    pontos.push([lat / 1e5, lng / 1e5]);
  }
  return pontos;
}

/**
 * Projeta o trajeto num viewBox `largura × altura` com margem (athlete-share-cards-mapa, D1).
 * Equirretangular com `cos(lat média)`, escala única nos dois eixos (sem distorção) e centralizado.
 * Extensão zero num eixo (trajeto reto) usa a escala do outro; nos dois (ponto único), desenha no
 * centro — nunca divide por zero. Menos de 2 pontos → `null`: não há trajeto para mostrar.
 */
export function buildRouteFromGpsTrace(pontos: LatLng[], largura: number, altura: number, margem = 0.08): RouteGeometry | null {
  if (pontos.length < 2) return null;
  const latMedia = pontos.reduce((s, [la]) => s + la, 0) / pontos.length;
  const cos = Math.cos((latMedia * Math.PI) / 180);
  const proj = pontos.map(([la, ln]) => [ln * cos, -la] as [number, number]);

  const xs = proj.map((p) => p[0]);
  const ys = proj.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const dx = Math.max(...xs) - minX;
  const dy = Math.max(...ys) - minY;

  const uteisX = largura * (1 - 2 * margem);
  const uteisY = altura * (1 - 2 * margem);
  const escalas = [dx > 0 ? uteisX / dx : Infinity, dy > 0 ? uteisY / dy : Infinity];
  const escala = Math.min(...escalas);
  const k = Number.isFinite(escala) ? escala : 0;

  const offX = (largura - dx * k) / 2;
  const offY = (altura - dy * k) / 2;
  const tela = proj.map(([x, y]) => [arred(offX + (x - minX) * k), arred(offY + (y - minY) * k)] as [number, number]);

  return {
    d: tela.map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'}${x} ${y}`).join(' '),
    inicio: tela[0],
    fim: tela[tela.length - 1],
  };
}

function arred(v: number): number {
  return Math.round(v * 10) / 10;
}
