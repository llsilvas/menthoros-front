import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Guarda de arquitetura: o acesso ao token e às claims vive **só** em `src/context/auth/`.
 *
 * Existe porque a migração para Authorization Code + PKCE
 * (`migrate-login-to-authorization-code-pkce`) troca o mecanismo de armazenamento. Se um consumidor
 * novo voltar a ler `localStorage` ou a decodificar o JWT por conta própria, ele continua
 * funcionando hoje e quebra silenciosamente depois — foi exatamente essa dispersão (oito pontos)
 * que tornou a migração arriscada.
 *
 * Deliberadamente por **padrão**, não por lista de arquivos: uma lista envelhece e não pega o
 * consumidor que alguém adiciona amanhã.
 */

const RAIZ = join(__dirname, '..', '..');
const MODULO_AUTH = join(RAIZ, 'context', 'auth');

/** Onde o token pode legitimamente ser lido/decodificado. */
const PERMITIDOS = [
  join(MODULO_AUTH, 'session.ts'),
  join(MODULO_AUTH, 'jwt.ts'),
  join(MODULO_AUTH, 'AuthProvider.tsx'),
];

const EXTENSOES = ['.ts', '.tsx'];

function listarFontes(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return listarFontes(caminho);
    if (!EXTENSOES.some((e) => nome.endsWith(e))) return [];
    // Testes podem montar token e storage à vontade — a guarda é sobre código de produção.
    if (nome.includes('.test.')) return [];
    return [caminho];
  });
}

const fontes = listarFontes(RAIZ).filter((f) => !PERMITIDOS.includes(f));

describe('acesso ao token está centralizado', () => {
  it('nenhum arquivo fora do módulo de auth lê a chave do token', () => {
    const infratores = fontes.filter((f) => readFileSync(f, 'utf8').includes('@Menthoros:token'));

    expect(
      infratores.map((f) => relative(RAIZ, f)),
      'use getAccessToken()/getAccessTokenSync() de context/auth/session',
    ).toEqual([]);
  });

  it('nenhum arquivo fora do módulo de auth decodifica o JWT', () => {
    const infratores = fontes.filter((f) => readFileSync(f, 'utf8').includes('decodeJwtPayload'));

    expect(
      infratores.map((f) => relative(RAIZ, f)),
      'use getClaims()/getTenantId()/getRoles() de context/auth/session',
    ).toEqual([]);
  });

  it('a própria guarda está olhando para o código (protege contra varredura vazia)', () => {
    // Sem esta asserção, um erro de caminho faria os dois testes acima passarem por vacuidade.
    expect(fontes.length).toBeGreaterThan(50);
  });
});
