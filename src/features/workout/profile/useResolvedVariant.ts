import { useCallback, useEffect, useRef, useState } from 'react';

export type ProfileVariant = 'full' | 'compact' | 'sparkline';
export type VariantProp = 'auto' | ProfileVariant;

const LIMITE_FULL = 560;
const LIMITE_COMPACT = 280;

/**
 * Histerese: sem ela a variante troca de ida e volta durante a animação de
 * abertura de um diálogo, e o componente pisca entre dois layouts.
 */
const HISTERESE_PX = 24;

function variantePara(largura: number, atual: ProfileVariant): ProfileVariant {
  // O limiar de subida é mais alto que o de descida — é isso que impede a
  // oscilação em torno da fronteira.
  const subirParaFull = atual === 'full' ? LIMITE_FULL - HISTERESE_PX : LIMITE_FULL;
  const subirParaCompact = atual === 'sparkline' ? LIMITE_COMPACT : LIMITE_COMPACT - HISTERESE_PX;

  if (largura >= subirParaFull) return 'full';
  if (largura >= subirParaCompact) return 'compact';
  return 'sparkline';
}

/**
 * Resolve a variante pela largura do **container**, não do viewport.
 *
 * O perfil vive dentro de diálogos e células de grid cuja largura não acompanha
 * a da janela: amarrar ao breakpoint global renderiza a variante `full` num card
 * de 240px numa tela de 1440px.
 */
export function useResolvedVariant(prop: VariantProp = 'auto') {
  const elemento = useRef<HTMLDivElement | null>(null);
  const [resolvida, setResolvida] = useState<ProfileVariant>(prop === 'auto' ? 'full' : prop);
  const [largura, setLargura] = useState(0);

  // Mede já no callback do ref, antes do primeiro paint. Sem isto o componente
  // nasce `full` e corrige na primeira entrega do observer — um flash de layout
  // errado em qualquer container estreito.
  const ref = useCallback((node: HTMLDivElement | null) => {
    elemento.current = node;
    if (!node) return;
    const w = node.getBoundingClientRect().width;
    if (w > 0) {
      setLargura(w);
      setResolvida((atual) => variantePara(w, atual));
    }
  }, []);

  useEffect(() => {
    if (prop !== 'auto') {
      setResolvida(prop);
      return;
    }
    const el = elemento.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entradas) => {
      // `borderBoxSize`, e não `contentRect`: o `ref` está no card, cujo padding
      // MUDA com a variante (16px em `full`, 12px em `compact`). Medir o content
      // box faria o limiar se deslocar conforme o próprio estado que ele decide
      // — um limiar auto-referente, que oscila justo perto da fronteira.
      const entrada = entradas[0];
      const w = entrada?.borderBoxSize?.[0]?.inlineSize
        ?? entrada?.target.getBoundingClientRect().width
        ?? 0;
      setLargura(w);
      setResolvida((atual) => variantePara(w, atual));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [prop]);

  return { ref, variant: resolvida, containerWidth: largura };
}
