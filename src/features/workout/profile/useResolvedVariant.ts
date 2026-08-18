import { useEffect, useRef, useState } from 'react';

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
  const ref = useRef<HTMLDivElement | null>(null);
  const [resolvida, setResolvida] = useState<ProfileVariant>(prop === 'auto' ? 'full' : prop);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    if (prop !== 'auto') {
      setResolvida(prop);
      return;
    }
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entradas) => {
      const w = entradas[0]?.contentRect.width ?? 0;
      setLargura(w);
      setResolvida((atual) => variantePara(w, atual));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [prop]);

  return { ref, variant: resolvida, containerWidth: largura };
}
