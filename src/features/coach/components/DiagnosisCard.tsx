import type { ReactNode } from 'react';
import { Card } from '../../../shared/components/Card';
import { CardHeader } from '../../../shared/components/CardHeader';

interface DiagnosisCardProps {
  title: string;
  /** Diz o que o conteúdo mostra (num gráfico, também a unidade) — o título sozinho não diz. */
  subtitle?: string;
  /** Controles ou legenda, alinhados à direita do título. */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Card da aba Diagnóstico (padrão da Proposta). Diferente do `SectionCard`: título em caixa normal
 * com subtítulo explicativo e a ação na mesma linha, sem barra de cabeçalho — o cabeçalho diz o
 * que o conteúdo mostra, em vez de só nomeá-lo.
 */
export function DiagnosisCard({ title, subtitle, action, children }: DiagnosisCardProps) {
  return (
    <Card
      component="section"
      aria-label={title}
      variant="flat"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        minWidth: 0,
        px: { xs: 1.5, xl: 2.25 },
        pt: { xs: 1.5, xl: 2.25 },
        pb: { xs: 1, xl: 1.25 },
      }}
    >
      <CardHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </Card>
  );
}
