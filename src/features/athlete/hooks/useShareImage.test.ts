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
    // Troca só depois que a captura antiga começou: é o resultado dela que precisa ser descartado.
    await waitFor(() => expect(toBlob).toHaveBeenCalledTimes(1));
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

  it('podeCapturar falso: não rasteriza e não fica "gerando" (gate de consentimento, D4)', async () => {
    const { result } = renderHook(() => useShareImage(ref, 'rota|story', () => false));
    await waitFor(() => expect(result.current.generating).toBe(false));
    expect(toBlob).not.toHaveBeenCalled();
    expect(result.current.blob).toBeNull();
  });

  it('troca de modelo enquanto as fontes carregam: a geração antiga não captura (CA6)', async () => {
    let liberarFontes: () => void = () => {};
    const fontes = new Promise<void>((r) => { liberarFontes = r; });
    Object.defineProperty(document, 'fonts', { value: { ready: fontes }, configurable: true });
    vi.mocked(toBlob).mockResolvedValue(new Blob(['x']));
    let permitido = true;

    const { rerender } = renderHook(({ v }) => useShareImage(ref, v, () => permitido), { initialProps: { v: 'semana|quadrado' } });
    // Atleta troca para Rota sem consentimento antes de as fontes ficarem prontas.
    permitido = false;
    rerender({ v: 'rota|story' });
    liberarFontes();
    await fontes;
    await Promise.resolve();

    expect(toBlob).not.toHaveBeenCalled();
    Reflect.deleteProperty(document, 'fonts');
  });

  it('exporta sem cacheBust (quebraria a foto em data/blob URL)', async () => {
    vi.mocked(toBlob).mockResolvedValue(new Blob(['x']));
    renderHook(() => useShareImage(ref, 'v'));
    await waitFor(() => expect(toBlob).toHaveBeenCalledWith(node, expect.objectContaining({ cacheBust: false })));
  });
});
