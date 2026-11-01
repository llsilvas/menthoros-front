import { describe, it, expect } from 'vitest';
import * as C from './content';

// landing-oferta-fundadora-v2: a copy tem que dizer só o que o produto faz hoje — Garmin lido
// direto; Apple Watch e outras marcas "em teste via intervals.icu" — e a oferta v2 (paralelo,
// convite de atletas pelo treinador, primeira semana acompanhada, devolução de 30 dias).

const todaACopy = JSON.stringify(C);

describe('integrações (CA-02, CA-03)', () => {
  it('o aviso do Garmin diz "direto" e põe as outras marcas em teste via intervals.icu', () => {
    const texto = C.garminNotice.pre + C.garminNotice.brand + C.garminNotice.post;
    expect(texto).toMatch(/direto/i);
    expect(texto).toMatch(/Apple Watch/);
    expect(texto).toMatch(/em teste via intervals\.icu/i);
    expect(texto).not.toMatch(/só lê|ainda não/i);
  });

  it('a mensagem de outra marca não diz que só o Garmin é lido', () => {
    const body = C.accessSuccess.outraMarca.body;
    expect(body).toMatch(/em teste via intervals\.icu/i);
    expect(body).not.toMatch(/só lê/i);
  });

  it('"Como funciona" e o FAQ do relógio não prometem outra marca como pronta', () => {
    expect(C.how.steps[0].b).toMatch(/em teste via intervals\.icu/i);
    const relogio = C.faq.items.find((i) => /relógio específico/i.test(i.q));
    expect(relogio?.a).toMatch(/em teste/i);
    expect(relogio?.a).not.toMatch(/Nesta primeira turma, sim/);
  });
});

describe('oferta v2 (CA-01, CA-04, CA-07)', () => {
  it('o hero cita o teste em paralelo, sem migrar', () => {
    expect(C.hero.scarcity).toMatch(/em paralelo, sem migrar/);
  });

  it('o bloco fundador tem três itens: paralelo, convite com primeira semana acompanhada, devolução de 30 dias', () => {
    expect(C.founderOffer.perks).toHaveLength(3);
    const [paralelo, convite, devolucao] = C.founderOffer.perks;
    expect(paralelo).toMatch(/em paralelo/i);
    expect(paralelo).toMatch(/nem cancelar|sem migrar|nada para migrar/i);
    expect(convite).toMatch(/convida/i);
    expect(convite).toMatch(/autoriza a conexão com o Garmin/i);
    expect(convite).toMatch(/primeira semana/i);
    expect(devolucao).toMatch(/30 dias/);
    expect(devolucao).toMatch(/primeiro mês/i);
  });

  it('nenhum texto diz que o Menthoros cadastra atleta ou conecta o relógio pelo treinador', () => {
    expect(todaACopy).not.toMatch(/cadastramos|cadastramos seus|conectamos o (seu )?(rel[oó]gio|garmin)/i);
  });

  it('"Quanto custa?" cita a devolução, e há a pergunta sobre largar a ferramenta atual', () => {
    const custo = C.faq.items.find((i) => i.q === 'Quanto custa?');
    expect(custo?.a).toMatch(/30 dias/);
    const paralelo = C.faq.items.find((i) => /largar a ferramenta/i.test(i.q));
    expect(paralelo?.a).toMatch(/em paralelo/i);
    expect(paralelo?.a).toMatch(/aval/i);
  });

  it('a proposta de valor de /waitlist cita o paralelo e mantém o preço do Basic', () => {
    expect(C.valueProposition.offerPre).toMatch(/em paralelo/i);
    expect(C.valueProposition.offerPre).toMatch(/Basic a $/);
  });
});

describe('o que a landing não pode prometer (CA-05)', () => {
  it('sem Strava, horas economizadas, depoimento, plano gratuito permanente ou atletas ilimitados', () => {
    expect(todaACopy).not.toMatch(/strava/i);
    expect(todaACopy).not.toMatch(/horas economizadas/i);
    expect(todaACopy).not.toMatch(/depoimento/i);
    expect(todaACopy).not.toMatch(/gratuito permanente(?!\?)/i);
    expect(todaACopy).not.toMatch(/atletas ilimitados/i);
  });
});
