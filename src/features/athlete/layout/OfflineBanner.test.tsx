import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from './OfflineBanner';

/**
 * Estado offline do shell do atleta (add-athlete-pwa-ux-hints, task 1.3) — só apresentação, sem
 * ação: não há o que o atleta possa fazer além de esperar a rede voltar.
 */
describe('OfflineBanner', () => {
  it('anuncia o estado offline como status, sem botão', () => {
    render(<OfflineBanner />);

    // `role="status"`: leitores de tela anunciam a mudança sem roubar o foco.
    expect(screen.getByRole('status')).toHaveTextContent(
      'Você está offline — os dados vão atualizar quando a conexão voltar',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
