import { describe, expect, it } from 'vitest';
import { resolvePrimaryAction, resolveActionAvailability, montarRascunhoContato } from './coachInboxHelpers';
import type { AttentionInfo } from '../adapters/coachInboxAdapters';

const SEM_SINAL = { planReviewStatus: null, planId: null, attention: null };

function atencao(over: Partial<AttentionInfo> = {}): AttentionInfo {
  return { severity: 'ALTA', reason: 'INATIVIDADE', suggestedAction: 'Entrar em contato', recencyDays: 14, ...over };
}

describe('resolvePrimaryAction', () => {
  /** A tese do produto: a IA propõe, o treinador decide. Decidir sobre o plano vem antes de tudo. */
  it('plano aguardando revisão vence qualquer outro sinal', () => {
    const acao = resolvePrimaryAction({
      planReviewStatus: 'AGUARDANDO_REVISAO',
      planId: 'p1',
      attention: atencao(),
    });

    expect(acao.kind).toBe('aprovar-plano');
    expect(acao.primary).toBe(true);
  });

  it('sem plano pendente, inatividade leva a contatar o atleta', () => {
    const acao = resolvePrimaryAction({ planReviewStatus: null, planId: null, attention: atencao() });

    expect(acao.kind).toBe('contatar-atleta');
    expect(acao.primary).toBe(true);
  });

  /**
   * Sinal que não é de engajamento não vira "contatar": sobrecarga se resolve ajustando o plano,
   * não mandando mensagem. Mandar o coach conversar quando o problema é carga desperdiça a ação.
   */
  it('sinal de carga não vira contato — cai no default', () => {
    const acao = resolvePrimaryAction({
      planReviewStatus: null,
      planId: null,
      attention: atencao({ reason: 'SOBRECARGA' }),
    });

    expect(acao.kind).toBe('abrir-plano');
  });

  it('aderência é sinal de engajamento e leva a contatar', () => {
    const acao = resolvePrimaryAction({
      planReviewStatus: null,
      planId: null,
      attention: atencao({ reason: 'ADERENCIA' }),
    });

    expect(acao.kind).toBe('contatar-atleta');
  });

  /**
   * Atleta saudável: a tela NÃO fica sem ação (era o defeito — "Aprovar plano" cinza e morto), mas
   * a ação também não usurpa o accent. Navegar não é decidir.
   */
  it('atleta sem nada pendente recebe ação de navegação, sem accent', () => {
    const acao = resolvePrimaryAction(SEM_SINAL);

    expect(acao.kind).toBe('abrir-plano');
    expect(acao.primary).toBe(false);
  });

  it('plano já aprovado não oferece aprovar de novo', () => {
    const acao = resolvePrimaryAction({ planReviewStatus: 'APROVADO', planId: 'p1', attention: null });

    expect(acao.kind).toBe('abrir-plano');
  });

  /** Sem `planId` não há o que aprovar, mesmo que o status diga que aguarda revisão. */
  it('status de revisão sem plano identificado não vira aprovar', () => {
    const acao = resolvePrimaryAction({ planReviewStatus: 'AGUARDANDO_REVISAO', planId: null, attention: atencao() });

    expect(acao.kind).toBe('contatar-atleta');
  });

  it('nunca devolve ausência de ação', () => {
    const entradas = [
      SEM_SINAL,
      { planReviewStatus: 'REJEITADO' as const, planId: 'p1', attention: null },
      { planReviewStatus: null, planId: null, attention: atencao({ reason: 'ZONAS_VENCIDAS' }) },
    ];

    for (const entrada of entradas) {
      expect(resolvePrimaryAction(entrada).kind).toBeTruthy();
    }
  });
});

describe('resolveActionAvailability', () => {
  /**
   * Aplicabilidade ≠ disponibilidade. `resolvePrimaryAction` diz QUAL ação aparece e nunca devolve
   * botão morto; esta função diz se ela está clicável AGORA. Misturar as duas foi o que produziu o
   * "Aprovar plano" cinza permanente que a auditoria encontrou.
   */
  it('mutação em voo bloqueia com estado de loading', () => {
    expect(resolveActionAvailability({ acting: true, lastErrorStatus: null })).toBe('loading');
  });

  it('conflito de estado (409) é distinto de erro genérico', () => {
    expect(resolveActionAvailability({ acting: false, lastErrorStatus: 409 })).toBe('stale');
    expect(resolveActionAvailability({ acting: false, lastErrorStatus: 422 })).toBe('stale');
  });

  it('falta de permissão (403) tem estado próprio', () => {
    expect(resolveActionAvailability({ acting: false, lastErrorStatus: 403 })).toBe('forbidden');
  });

  it('erro desconhecido não vira "pronto"', () => {
    expect(resolveActionAvailability({ acting: false, lastErrorStatus: 500 })).toBe('error');
  });

  it('sem mutação e sem erro, a ação está pronta', () => {
    expect(resolveActionAvailability({ acting: false, lastErrorStatus: null })).toBe('ready');
  });
});

describe('montarRascunhoContato', () => {
  /**
   * O botão "Contatar atleta" disparava um toast vazio ("Mensagem preparada…") e nada acontecia.
   * O rascunho carrega o que o coach diria: quem, o quê, há quanto tempo e o que fazer.
   */
  it('inclui nome, motivo, recência e ação sugerida', () => {
    const texto = montarRascunhoContato('Ana Silva', atencao());

    expect(texto).toContain('Ana Silva');
    expect(texto.toLowerCase()).toContain('14 dias');
    expect(texto).toContain('Entrar em contato');
  });

  it('sem recência, não inventa prazo', () => {
    const texto = montarRascunhoContato('Ana Silva', atencao({ recencyDays: null }));

    expect(texto).toContain('Ana Silva');
    expect(texto).not.toMatch(/\bnull\b|\b0 dias\b|undefined/);
  });

  it('sem sinal, ainda produz uma mensagem utilizável', () => {
    const texto = montarRascunhoContato('Ana Silva', null);

    expect(texto).toContain('Ana Silva');
    expect(texto.length).toBeGreaterThan(20);
  });
});
