import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toBlob } from 'html-to-image';
import { useShareImage } from './useShareImage';

vi.mock('html-to-image', () => ({ toBlob: vi.fn() }));

const node = document.createElement('div');
const ref = { current: node };

describe('useShareImage', () => {
  afterEach(() => vi.mocked(toBlob).mockReset());

  it('gera o PNG do nó com pixelRatio 3 (360 px → 1080 px)', async () => {
    const png = new Blob(['a'], { type: 'image/png' });
    vi.mocked(toBlob).mockResolvedValue(png);

    const { result } = renderHook(() => useShareImage(ref, 'plano|story'));

    expect(result.current.generating).toBe(true);
    await waitFor(() => expect(result.current.blob).toBe(png));
    expect(toBlob).toHaveBeenCalledWith(node, expect.objectContaining({ pixelRatio: 3 }));
  });

  it('regera quando a versão muda e descarta o resultado antigo', async () => {
    const velho = new Blob(['velho']);
    const novo = new Blob(['novo']);
    let liberarVelho: (b: Blob) => void = () => {};
    vi.mocked(toBlob)
      .mockImplementationOnce(() => new Promise((r) => { liberarVelho = r; }))
      .mockResolvedValueOnce(novo);

    const { result, rerender } = renderHook(({ v }) => useShareImage(ref, v), { initialProps: { v: 'plano|story' } });
    rerender({ v: 'semana|quadrado' });
    await waitFor(() => expect(result.current.blob).toBe(novo));

    liberarVelho(velho);
    await Promise.resolve();
    expect(result.current.blob).toBe(novo);
  });

  it('expõe o erro quando a rasterização falha', async () => {
    vi.mocked(toBlob).mockImplementation(() => Promise.reject(new Error('canvas tainted')));
    const { result } = renderHook(() => useShareImage(ref, 'x'));
    await waitFor(() => expect(result.current.error?.message).toBe('canvas tainted'));
    expect(result.current.generating).toBe(false);
  });
});
