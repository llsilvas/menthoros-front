import { describe, it, expect, beforeEach } from 'vitest';
import { captureAndPersistUtm, getUtmForSubmission } from './utmPersistence';

function setUrl(pathAndSearch: string, hash = '') {
  window.history.pushState({}, '', `${pathAndSearch}${hash}`);
}

describe('utmPersistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setUrl('/');
  });

  it('não persiste nada quando a URL não tem UTM', () => {
    captureAndPersistUtm();
    expect(sessionStorage.getItem('menthoros:utm')).toBeNull();
  });

  it('persiste a UTM da query de PATH na primeira captura', () => {
    setUrl('/?utm_source=instagram&utm_medium=bio');
    captureAndPersistUtm();
    expect(JSON.parse(sessionStorage.getItem('menthoros:utm')!)).toEqual({
      utmSource: 'instagram',
      utmMedium: 'bio',
    });
  });

  it('lê a UTM de dentro do fragmento de hash quando não há query de PATH', () => {
    setUrl('/', '#/waitlist?utm_source=instagram&utm_campaign=turma-fundadora');
    captureAndPersistUtm();
    expect(JSON.parse(sessionStorage.getItem('menthoros:utm')!)).toEqual({
      utmSource: 'instagram',
      utmCampaign: 'turma-fundadora',
    });
  });

  it('não sobrescreve a UTM já capturada nesta sessão numa carga seguinte sem UTM', () => {
    setUrl('/?utm_source=instagram');
    captureAndPersistUtm();

    setUrl('/#/waitlist'); // nova carga, sem utm na URL
    captureAndPersistUtm();

    expect(JSON.parse(sessionStorage.getItem('menthoros:utm')!)).toEqual({ utmSource: 'instagram' });
  });

  it('getUtmForSubmission lê o valor persistido, mesmo com a URL atual sem UTM', () => {
    setUrl('/?utm_source=instagram&utm_content=perfil');
    captureAndPersistUtm();

    setUrl('/#/waitlist');
    expect(getUtmForSubmission()).toEqual({ utmSource: 'instagram', utmContent: 'perfil' });
  });

  it('getUtmForSubmission cai para a URL atual quando nada foi persistido', () => {
    setUrl('/#/waitlist?utm_source=direto');
    expect(getUtmForSubmission()).toEqual({ utmSource: 'direto' });
  });

  it('getUtmForSubmission retorna objeto vazio sem persistência nem UTM na URL', () => {
    expect(getUtmForSubmission()).toEqual({});
  });
});
