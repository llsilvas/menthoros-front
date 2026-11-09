import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../../api/core/ApiError';
import { TrajetoShareConsentService } from '../../../../api/services/TrajetoShareConsentService';
import { POLITICA_VERSAO } from '../../../../pages/waitlist/politicaPrivacidadeConteudo';
import { TrajectoryShareConsentDialog } from './TrajectoryShareConsentDialog';
import { TrajectoryPrivacyCard } from './TrajectoryPrivacyCard';

vi.mock('../../../../api/services/TrajetoShareConsentService');

let router: ReturnType<typeof createHashRouter> | null = null;
function renderComRouter(ui: ReactElement) {
  router = createHashRouter([{ path: '/', element: ui }]);
  return render(<RouterProvider router={router} />);
}

const estado = (granted: boolean) => ({ granted, policyVersion: POLITICA_VERSAO, registradoEm: null });
const stale = () => new ApiError({ method: 'POST', url: '' }, { url: '', ok: false, status: 409, statusText: 'Conflict', body: { code: 'CONSENT_VERSION_STALE' } }, 'x');

describe('TrajectoryShareConsentDialog', () => {
  afterEach(() => router?.dispose());

  it('diz que a imagem mostra início e fim e linka a § 6.4 pelo hash router', () => {
    renderComRouter(<TrajectoryShareConsentDialog open salvando={false} desatualizado={false} erro={null} onConfirmar={vi.fn()} onRecusar={vi.fn()} rotuloRecusar="Usar modelo sem mapa" />);
    expect(screen.getByText(/incluindo onde você começou e terminou/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Política de Privacidade/ })).toHaveAttribute('href', '#/privacidade');
  });

  it('"Usar modelo sem mapa" chama a recusa, não a confirmação (CA4)', async () => {
    const onConfirmar = vi.fn();
    const onRecusar = vi.fn();
    renderComRouter(<TrajectoryShareConsentDialog open salvando={false} desatualizado={false} erro={null} onConfirmar={onConfirmar} onRecusar={onRecusar} rotuloRecusar="Usar modelo sem mapa" />);
    await userEvent.click(screen.getByRole('button', { name: 'Usar modelo sem mapa' }));
    expect(onRecusar).toHaveBeenCalledOnce();
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it('Política desatualizada: pede para recarregar e desabilita a confirmação (CA6)', () => {
    renderComRouter(<TrajectoryShareConsentDialog open salvando={false} desatualizado erro={null} onConfirmar={vi.fn()} onRecusar={vi.fn()} rotuloRecusar="x" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Recarregue a página/);
    expect(screen.getByRole('button', { name: 'Entendi, compartilhar' })).toBeDisabled();
  });
});

describe('TrajectoryPrivacyCard', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => router?.dispose());

  it('concedido: desligar revoga no servidor (CA7)', async () => {
    vi.mocked(TrajetoShareConsentService.obter).mockResolvedValue(estado(true) as never);
    vi.mocked(TrajetoShareConsentService.revogar).mockResolvedValue(estado(false) as never);
    renderComRouter(<TrajectoryPrivacyCard />);

    const chave = await screen.findByRole('switch', { name: /Mostrar meu trajeto/ });
    expect(chave).toBeChecked();
    await userEvent.click(chave);

    expect(TrajetoShareConsentService.revogar).toHaveBeenCalledOnce();
    await waitFor(() => expect(chave).not.toBeChecked());
  });

  it('ligar abre o aviso e só concede ao confirmar, enviando a versão apresentada', async () => {
    vi.mocked(TrajetoShareConsentService.obter).mockResolvedValue(estado(false) as never);
    vi.mocked(TrajetoShareConsentService.conceder).mockResolvedValue(estado(true) as never);
    renderComRouter(<TrajectoryPrivacyCard />);

    await userEvent.click(await screen.findByRole('switch', { name: /Mostrar meu trajeto/ }));
    expect(TrajetoShareConsentService.conceder).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Entendi, mostrar trajeto' }));

    expect(TrajetoShareConsentService.conceder).toHaveBeenCalledWith(POLITICA_VERSAO);
    await waitFor(() => expect(screen.getByRole('switch', { name: /Mostrar meu trajeto/ })).toBeChecked());
  });

  it('409 ao confirmar: aviso continua aberto pedindo para recarregar (CA6)', async () => {
    vi.mocked(TrajetoShareConsentService.obter).mockResolvedValue(estado(false) as never);
    vi.mocked(TrajetoShareConsentService.conceder).mockRejectedValue(stale());
    renderComRouter(<TrajectoryPrivacyCard />);

    await userEvent.click(await screen.findByRole('switch', { name: /Mostrar meu trajeto/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Entendi, mostrar trajeto' }));

    expect(await screen.findByText(/Recarregue a página/)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Mostrar meu trajeto/, hidden: true })).not.toBeChecked();
  });

  it('"Agora não" fecha sem conceder', async () => {
    vi.mocked(TrajetoShareConsentService.obter).mockResolvedValue(estado(false) as never);
    renderComRouter(<TrajectoryPrivacyCard />);
    await userEvent.click(await screen.findByRole('switch', { name: /Mostrar meu trajeto/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Agora não' }));
    expect(TrajetoShareConsentService.conceder).not.toHaveBeenCalled();
  });

  it('falha ao carregar: não mostra a chave (seria palpite) e oferece tentar de novo', async () => {
    vi.mocked(TrajetoShareConsentService.obter).mockRejectedValueOnce(new Error('rede')).mockResolvedValueOnce(estado(true) as never);
    renderComRouter(<TrajectoryPrivacyCard />);

    expect(await screen.findByText('Não deu para carregar esta preferência.')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByRole('switch', { name: /Mostrar meu trajeto/ })).toBeChecked();
  });

  it('falha ao revogar: avisa e a chave continua ligada', async () => {
    vi.mocked(TrajetoShareConsentService.obter).mockResolvedValue(estado(true) as never);
    vi.mocked(TrajetoShareConsentService.revogar).mockRejectedValue(new Error('500'));
    renderComRouter(<TrajectoryPrivacyCard />);

    await userEvent.click(await screen.findByRole('switch', { name: /Mostrar meu trajeto/ }));

    expect(await screen.findByText('Não deu para atualizar agora. Tente de novo.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Mostrar meu trajeto/ })).toBeChecked();
  });
});

