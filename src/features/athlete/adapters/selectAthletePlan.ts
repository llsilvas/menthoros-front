import type { PlanoSemanal } from '../../../types/PlanoSemanal';

/**
 * Seleciona o plano da semana a exibir para o atleta a partir da resposta de
 * `GET /api/v1/planos/{atletaId}` (que já filtra apenas planos APROVADO para a role ATLETA
 * no backend). O contrato real do backend retorna um objeto único, mas o service versionado
 * tipa como lista — normalizamos ambos os formatos defensivamente.
 *
 * Regra: prefere o plano cuja semana [semanaInicio, semanaFim] contém `hoje`; senão o mais
 * recente por `semanaInicio`; `null` quando não há plano.
 */
export function selectAthletePlan(
  response: PlanoSemanal | PlanoSemanal[] | null | undefined,
  hoje: string = new Date().toISOString().slice(0, 10),
): PlanoSemanal | null {
  const planos = response == null ? [] : Array.isArray(response) ? response : [response];
  if (planos.length === 0) return null;

  const daSemana = planos.find((p) => p.semanaInicio <= hoje && hoje <= p.semanaFim);
  if (daSemana) return daSemana;

  return planos.reduce((maisRecente, p) =>
    p.semanaInicio > maisRecente.semanaInicio ? p : maisRecente,
  );
}
