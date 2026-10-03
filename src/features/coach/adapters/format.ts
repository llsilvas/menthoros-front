/** Formatadores pt-BR dos adapters do coach — um lugar só, sem dependência de componente. */

export const decimal = (v: number, casas: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const signed = (v: number, casas: number) => `${v > 0 ? '+' : ''}${decimal(v, casas)}`;

/** Km com uma casa, vírgula decimal (sem a unidade). */
export const formatKmPt = (km: number) => decimal(km, 1);

/** Número seguido da palavra no singular ou no plural: `plural(3, 'dia', 'dias')` → "3 dias". */
export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
