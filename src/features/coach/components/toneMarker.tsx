import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export type MetricToneName = 'neutral' | 'success' | 'warning' | 'danger';

/**
 * Marcador de estado por **forma e texto**, não só por cor.
 *
 * O valor de uma métrica ("120 km") não diz se está bom ou ruim — quem diz é o tone, e ele vivia
 * apenas na cor do número. Para quem tem deficiência de visão de cores, âmbar e verde no mesmo
 * número são o mesmo pixel. O ícone dá a forma; `titleAccess` dá o texto ao leitor de tela.
 */
export const TONE_MARKER = {
  success: { Icone: CheckCircleIcon, rotulo: 'Adequado' },
  warning: { Icone: WarningAmberIcon, rotulo: 'Atenção' },
  danger: { Icone: ErrorIcon, rotulo: 'Crítico' },
} as const;

export function marcadorDe(tone: MetricToneName) {
  return tone === 'neutral' ? null : TONE_MARKER[tone];
}
