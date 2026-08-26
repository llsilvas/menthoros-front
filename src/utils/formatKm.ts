/** Distância em km no formato PT-BR, uma casa decimal ("14,5"). Sem unidade — o chamador decide. */
export function formatKm(km: number): string {
  return km.toFixed(1).replace('.', ',');
}
