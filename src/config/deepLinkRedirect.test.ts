import { describe, expect, it, vi } from 'vitest';
import { redirectPathDeepLink } from './deepLinkRedirect';

/** Location falso mínimo para exercitar o guard sem tocar em window. */
function fakeLocation(url: string): Location {
  const u = new URL(url);
  return {
    origin: u.origin,
    pathname: u.pathname,
    search: u.search,
    hash: u.hash,
    replace: vi.fn(),
  } as unknown as Location;
}

describe('redirectPathDeepLink', () => {
  it('traduz /waitlist?utm=… para /?utm=…#/waitlist preservando a query', () => {
    const loc = fakeLocation('https://app.menthoros.com/waitlist?utm_source=instagram&utm_campaign=x');

    const redirecionou = redirectPathDeepLink(loc);

    expect(redirecionou).toBe(true);
    expect(loc.replace).toHaveBeenCalledWith(
      'https://app.menthoros.com/?utm_source=instagram&utm_campaign=x#/waitlist',
    );
  });

  it('traduz /cadastro sem query', () => {
    const loc = fakeLocation('https://app.menthoros.com/cadastro');

    expect(redirectPathDeepLink(loc)).toBe(true);
    expect(loc.replace).toHaveBeenCalledWith('https://app.menthoros.com/#/cadastro');
  });

  it.each(['/privacidade', '/termos'])('traduz a rota pública %s', (path) => {
    const loc = fakeLocation(`https://app.menthoros.com${path}`);
    expect(redirectPathDeepLink(loc)).toBe(true);
    expect(loc.replace).toHaveBeenCalledWith(`https://app.menthoros.com/#${path}`);
  });

  it('NÃO age quando já há fragmento (rota de hash normal)', () => {
    const loc = fakeLocation('https://app.menthoros.com/?utm_source=x#/waitlist');
    expect(redirectPathDeepLink(loc)).toBe(false);
    expect(loc.replace).not.toHaveBeenCalled();
  });

  it('NÃO age na raiz (landing)', () => {
    const loc = fakeLocation('https://app.menthoros.com/?utm_source=x');
    expect(redirectPathDeepLink(loc)).toBe(false);
    expect(loc.replace).not.toHaveBeenCalled();
  });

  it('NÃO age em path desconhecido (deixa o SPA/404 seguir)', () => {
    const loc = fakeLocation('https://app.menthoros.com/qualquer-coisa');
    expect(redirectPathDeepLink(loc)).toBe(false);
    expect(loc.replace).not.toHaveBeenCalled();
  });
});
