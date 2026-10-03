import { semantic, surface } from './tokens';
import type { MetricTone } from '../types/FaixaTsb';

/**
 * Cor de um tom de métrica. Os tons de estado são fixos (semantic 500); o neutro depende do uso —
 * valor em texto (`surface[50]`, padrão), marca de gráfico (`surface[300]`) ou texto apagado
 * (`surface[400]`) —, por isso vem do chamador. Antes, cada tela tinha a própria tabela, e uma
 * troca de token divergia em silêncio.
 */
export function toneColor(tone: MetricTone, neutral: string = surface[50]): string {
  switch (tone) {
    case 'success':
      return semantic.success[500];
    case 'warning':
      return semantic.warning[500];
    case 'danger':
      return semantic.danger[500];
    default:
      return neutral;
  }
}
