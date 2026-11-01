import { describe, it, expect } from 'vitest';
import * as C from './content';

// landing-oferta-fundadora-v2: a copy tem que dizer só o que o produto faz hoje — Garmin lido
// direto; Apple Watch e outras marcas "em teste via intervals.icu" — e a oferta v2. Os testes
// travam as promessas (e o que não pode ser prometido), não a redação inteira.

function coletarStrings(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor];
  if (Array.isArray(valor)) return valor.flatMap(coletarStrings);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(coletarStrings);
  return [];
}

const todasAsStrings = coletarStrings(C).join('\n');

describe('integrações (CA-02, CA-03)', () => {
  it('o aviso do Garmin diz "direto" e põe as outras marcas em teste via intervals.icu', () => {
    const texto = C.garminNotice.pre + C.garminNotice.brand + C.garminNotice.post;
    expect(texto).toMatch(/direto/i);
    expect(texto).toMatch(/Apple Watch/);
    expect(texto).toMatch(/em teste via intervals\.icu/i);
    expect(texto).not.toMatch(/só lê|ainda não/i);
  });

  it('a mensagem de outra marca não promete liberação nem diz que só o Garmin é lido', () => {
    const body = C.accessSuccess.outraMarca.body;
    expect(body).toMatch(/em teste via intervals\.icu/i);
    expect(body).not.toMatch(/só lê/i);
    expect(body).not.toMatch(/quando ela estiver liberada/i);
  });

  it('"Como funciona" e o FAQ do relógio põem outras marcas em teste', () => {
    expect(C.how.steps[0].b).toMatch(/em teste via intervals\.icu/i);
    const relogio = C.faq.items.find((i) => /relógio específico/i.test(i.q));
    expect(relogio?.a).toMatch(/em teste/i);
  });
});

describe('oferta v2 (CA-01, CA-04, CA-07)', () => {
  it('o hero cita o teste em paralelo, sem migrar', () => {
    expect(C.hero.scarcity).toMatch(/em paralelo, sem migrar/);
  });

  it('o bloco fundador tem três itens: paralelo, convite com autorização do Garmin e devolução de 30 dias', () => {
    expect(C.founderOffer.perks).toHaveLength(3);
    const [paralelo, convite, devolucao] = C.founderOffer.perks;
    expect(paralelo).toMatch(/em paralelo/i);
    expect(convite).toMatch(/autoriza a conexão com o Garmin/i);
    expect(devolucao).toMatch(/30 dias/);
  });

  it('nenhum texto diz que o Menthoros cadastra atleta ou conecta o relógio pelo treinador', () => {
    expect(todasAsStrings).not.toMatch(/cadastramos/i);
    expect(todasAsStrings).not.toMatch(/conectamos o (seu )?(relógio|garmin)/i);
  });

  it('"Quanto custa?" cita a devolução, e há a pergunta sobre largar a ferramenta atual', () => {
    const custo = C.faq.items.find((i) => i.q === 'Quanto custa?');
    expect(custo?.a).toMatch(/30 dias/);
    const faqParalelo = C.faq.items.find((i) => /largar a ferramenta/i.test(i.q));
    expect(faqParalelo?.a).toMatch(/em paralelo/i);
    expect(faqParalelo?.a).toMatch(/aval/i);
  });

  it('a proposta de valor de /waitlist cita o paralelo e termina em "Basic a" (o preço vem de founderOffer)', () => {
    expect(C.valueProposition.offerPre).toMatch(/em paralelo/i);
    expect(C.valueProposition.offerPre).toContain('Basic a');
    expect(C.founderOffer.afterTrialPrice).toBe('R$ 99/mês');
  });
});

describe('o que a landing não pode prometer (CA-05)', () => {
  it('sem Strava, horas economizadas, depoimento, plano gratuito permanente ou atletas ilimitados', () => {
    expect(todasAsStrings).not.toMatch(/strava/i);
    expect(todasAsStrings).not.toMatch(/horas economizadas/i);
    expect(todasAsStrings).not.toMatch(/depoimento/i);
    // a pergunta do FAQ "Existe um plano gratuito permanente?" nega a existência; só ela pode citar
    const semPerguntaDoFaq = todasAsStrings.replace(/Existe um plano gratuito permanente\?/g, '');
    expect(semPerguntaDoFaq).not.toMatch(/gratuito permanente/i);
    expect(todasAsStrings).not.toMatch(/atletas ilimitados/i);
  });
});
