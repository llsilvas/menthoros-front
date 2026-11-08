import { describe, it, expect } from 'vitest';
import { DataNaoAplicadaError, mensagemDeErroAoSalvar } from './mensagemDeErroAoSalvar';

describe('mensagemDeErroAoSalvar', () => {
    it('data não aplicada chega ao treinador com a própria mensagem, não a genérica', () => {
        expect(mensagemDeErroAoSalvar(new DataNaoAplicadaError())).toMatch(/nova data não foi aplicada/);
    });

    it('erro comum vira a mensagem genérica', () => {
        expect(mensagemDeErroAoSalvar(new Error('Network Error'))).toBe('Não foi possível salvar o treino. Tente de novo.');
    });
});
