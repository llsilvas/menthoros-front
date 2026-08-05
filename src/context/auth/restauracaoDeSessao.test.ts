import { describe, it, expect, beforeEach } from 'vitest';
import {
  ehRecusaDeLoginSilencioso,
  ehRetornoDeAutorizacao,
  jaTentouRestaurar,
  limparTentativaDeRestauracao,
  marcarTentativaDeRestauracao,
} from './userManager';

/**
 * Restauração de sessão após recarregar a página.
 *
 * O token não é persistido (D2), então um `F5` deixa a memória vazia. Antes desta lógica, o app
 * concluía "anônimo" e mandava o usuário ao login — **bug encontrado no walking skeleton**, não em
 * teste: a tela piscava e voltava para o login.
 *
 * A correção pergunta ao Keycloak, com `prompt=none` por redirect, se a sessão ainda existe. Como é
 * um redirect, a guarda contra laço é parte do mecanismo, não um detalhe.
 */
describe('restauração de sessão', () => {
  beforeEach(() => {
    limparTentativaDeRestauracao();
  });

  describe('classificação do retorno', () => {
    it('reconhece o retorno com código de autorização', () => {
      expect(ehRetornoDeAutorizacao('http://app/?code=abc&state=xyz')).toBe(true);
    });

    // `prompt=none` sem sessão no provedor devolve isto. É a resposta correta, não uma falha.
    it('reconhece a recusa do login silencioso', () => {
      expect(ehRecusaDeLoginSilencioso('http://app/?error=login_required&state=xyz')).toBe(true);
      expect(ehRecusaDeLoginSilencioso('http://app/?error=interaction_required')).toBe(true);
    });

    it('não confunde recusa silenciosa com retorno bem-sucedido', () => {
      expect(ehRecusaDeLoginSilencioso('http://app/?code=abc&state=xyz')).toBe(false);
      expect(ehRetornoDeAutorizacao('http://app/?error=login_required&state=xyz')).toBe(false);
    });

    // Um erro real do provedor não pode ser tratado como "só não havia sessão", senão o app engole
    // a causa e manda o usuário para o login sem explicação.
    it('não trata erro genérico como recusa silenciosa', () => {
      expect(ehRecusaDeLoginSilencioso('http://app/?error=invalid_request')).toBe(false);
      expect(ehRecusaDeLoginSilencioso('http://app/')).toBe(false);
    });
  });

  describe('guarda contra laço', () => {
    it('permite a primeira tentativa e bloqueia a seguinte', () => {
      expect(jaTentouRestaurar()).toBe(false);

      marcarTentativaDeRestauracao();

      expect(jaTentouRestaurar()).toBe(true);
    });

    // Sem isto, um usuário que fez logout e recarregou ficaria preso: o app tentaria restaurar,
    // o Keycloak recusaria, e o ciclo recomeçaria a cada render.
    it('a marca sobrevive ao redirect (vive em sessionStorage)', () => {
      marcarTentativaDeRestauracao();

      expect(sessionStorage.getItem('menthoros:restauracao-tentada')).toBe('1');
    });

    it('um login bem-sucedido libera nova tentativa futura', () => {
      marcarTentativaDeRestauracao();
      limparTentativaDeRestauracao();

      expect(jaTentouRestaurar()).toBe(false);
    });
  });
});
