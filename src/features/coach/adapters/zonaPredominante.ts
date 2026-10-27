import type { ProfileMetrics } from '../../workout/profile/types';

type Metricas = Pick<ProfileMetrics, 'targetZone' | 'targetZoneSeconds' | 'distribution'>;

const minutos = (segundos: number): number => Math.round(segundos / 60);

export function minutosNaZonaAlvo(m: Metricas): number | null {
    return m.targetZone ? minutos(m.targetZoneSeconds) : null;
}

/** "24 min em Z5, 38 min em Z1": a zona alvo e a que mais tempo toma depois dela. */
export function detalheDaZonaPredominante(m: Metricas): string | null {
    if (!m.targetZone) return null;
    const outra = [...m.distribution]
        .filter((d) => d.zone !== m.targetZone)
        .sort((a, b) => b.seconds - a.seconds)[0];
    const partes = [`${minutos(m.targetZoneSeconds)} min em ${m.targetZone}`];
    if (outra) partes.push(`${minutos(outra.seconds)} min em ${outra.zone}`);
    return partes.join(', ');
}
