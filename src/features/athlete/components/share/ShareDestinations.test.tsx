import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareDestinations } from './ShareDestinations';

const png = new Blob(['png'], { type: 'image/png' });
const props = { blob: png, generating: false, error: null, fileName: 'menthoros-plano-story.png' };

function instalarShare(share: () => Promise<void>, canShare = true) {
  Object.defineProperty(navigator, 'share', { value: vi.fn(share), configurable: true, writable: true });
  Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => canShare), configurable: true, writable: true });
}

function removerShare() {
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'canShare');
}

describe('ShareDestinations', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:card');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    removerShare();
    vi.restoreAllMocks();
  });

  it('compartilha o PNG com o nome do arquivo pelo share sheet (CA6)', async () => {
    instalarShare(() => Promise.resolve());
    render(<ShareDestinations {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));

    const arg = vi.mocked(navigator.share).mock.calls[0][0] as ShareData;
    expect(arg.files?.[0].name).toBe('menthoros-plano-story.png');
    expect(arg.files?.[0].type).toBe('image/png');
  });

  it('fechar o share sheet (AbortError) não mostra erro', async () => {
    instalarShare(() => Promise.reject(new DOMException('cancelado', 'AbortError')));
    render(<ShareDestinations {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('outra falha do share orienta a usar Salvar', async () => {
    instalarShare(() => Promise.reject(new DOMException('negado', 'NotAllowedError')));
    render(<ShareDestinations {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para compartilhar — use Salvar.');
  });

  it('sem suporte a arquivos: só Salvar, que baixa o PNG (CA7)', async () => {
    removerShare();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('menthoros-plano-story.png');
      expect(this.href).toBe('blob:card');
    });
    render(<ShareDestinations {...props} />);

    expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:card');
  });

  it('canShare recusa arquivos: esconde Compartilhar', () => {
    instalarShare(() => Promise.resolve(), false);
    render(<ShareDestinations {...props} />);
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument();
  });

  it('enquanto a imagem é gerada os botões ficam desabilitados', () => {
    instalarShare(() => Promise.resolve());
    render(<ShareDestinations {...props} blob={null} generating />);
    expect(screen.getByRole('button', { name: 'Gerando imagem…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('falha ao gerar a imagem aparece como erro', () => {
    render(<ShareDestinations {...props} blob={null} error={new Error('canvas')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não deu para gerar a imagem');
  });
});
