import { describe, it, expect } from 'vitest';
import { parseUtmParams } from './parseUtm';

// add-waitlist-utm-attribution: captura os 4 parâmetros UTM padrão da query string.
// CA6 (Codex adversarial review): UTM acima de 255 caracteres é truncado, nunca descartado nem
// rejeitado — o backend tem @Size(max = 255) e devolveria 400 para um valor mais longo.

describe('parseUtmParams', () => {
  it('lê os 4 parâmetros UTM de uma query com todos presentes', () => {
    const params = parseUtmParams('?utm_source=instagram&utm_medium=social&utm_campaign=turma-fundadora&utm_content=bio-link');
    expect(params).toEqual({
      utmSource: 'instagram',
      utmMedium: 'social',
      utmCampaign: 'turma-fundadora',
      utmContent: 'bio-link',
    });
  });

  it('devolve objeto vazio para query sem nenhum parâmetro UTM', () => {
    expect(parseUtmParams('?ref=algumacoisa')).toEqual({});
  });

  it('devolve objeto vazio para query string vazia', () => {
    expect(parseUtmParams('')).toEqual({});
  });

  it('inclui só os campos presentes, ignorando os ausentes', () => {
    const params = parseUtmParams('?utm_source=instagram');
    expect(params).toEqual({ utmSource: 'instagram' });
  });

  it('trunca um valor acima de 255 caracteres em vez de rejeitar ou descartar (CA6)', () => {
    const longo = 'a'.repeat(300);
    const params = parseUtmParams(`?utm_content=${longo}`);
    expect(params.utmContent).toHaveLength(255);
    expect(params.utmContent).toBe('a'.repeat(255));
  });

  it('mantém um valor de exatamente 255 caracteres intacto', () => {
    const exato = 'b'.repeat(255);
    const params = parseUtmParams(`?utm_campaign=${exato}`);
    expect(params.utmCampaign).toBe(exato);
  });

  it('decodifica valores com caracteres especiais/percent-encoded', () => {
    const params = parseUtmParams('?utm_campaign=turma%20fundadora');
    expect(params.utmCampaign).toBe('turma fundadora');
  });
});
