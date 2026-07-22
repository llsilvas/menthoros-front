import { UsuarioService } from '../api/services/UsuarioService';

/**
 * Resolve o `atletaId` do usuário autenticado via `GET /users/me` — extraído (correção QA
 * 2026-07-22, achado do clean-code-reviewer) do boilerplate repetido em `useOnboarding`/
 * `useCalibracao`. Não é um hook (sem estado próprio, sem API do React) — função pura async, para
 * ser chamada dentro do fluxo de fetch de cada hook consumidor.
 *
 * `useAthletePlan`/`useCheckinAtual` (pré-existentes) repetem a mesma lógica de resolução mas não
 * foram migrados para reaproveitar esta função — fora do escopo desta mudança (código não tocado
 * por esta PR); considerar unificar os 4 se um quinto consumidor aparecer.
 */
export async function resolverAtletaIdAtual(): Promise<string | null> {
    const me = await UsuarioService.getMe();
    return me.atletaId ?? null;
}
