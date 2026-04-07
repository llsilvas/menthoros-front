import type { EtapaTreino } from '../../../../types/TreinoPlanejado';
import type { WorkoutBlock } from './types';
import type { ZoneKey } from '../../../../theme/tokens';

function getZoneFromEtapa(etapa: EtapaTreino): 1 | 2 | 3 | 4 | 5 {
  // Try to extract zone from intensidade field first
  if (etapa.intensidade) {
    const lower = etapa.intensidade.toLowerCase();
    if (lower.includes('z5') || lower.includes('zona 5') || lower.includes('vo2') || lower.includes('sprint')) return 5;
    if (lower.includes('z4') || lower.includes('zona 4') || lower.includes('limiar') || lower.includes('threshold')) return 4;
    if (lower.includes('z3') || lower.includes('zona 3') || lower.includes('tempo')) return 3;
    if (lower.includes('z2') || lower.includes('zona 2') || lower.includes('base') || lower.includes('aeróbico') || lower.includes('aerobico')) return 2;
  }

  // Infer from tipoEtapa
  const tipo = typeof etapa.tipoEtapa === 'string'
    ? etapa.tipoEtapa.toLowerCase()
    : (etapa.tipoEtapa as { value: string }).value?.toLowerCase() ?? '';

  if (tipo.includes('aquecimento') || tipo.includes('warmup') || tipo.includes('warm_up') ||
      tipo.includes('recuperacao') || tipo.includes('recuperação') || tipo.includes('recovery') ||
      tipo.includes('desaquecimento') || tipo.includes('cooldown') || tipo.includes('cool_down')) {
    return 1;
  }
  if (tipo.includes('base') || tipo.includes('leve') || tipo.includes('easy') ||
      tipo.includes('aerob') || tipo.includes('z2')) {
    return 2;
  }
  if (tipo.includes('tempo') || tipo.includes('z3') || tipo.includes('moderado') || tipo.includes('moderate')) {
    return 3;
  }
  if (tipo.includes('limiar') || tipo.includes('threshold') || tipo.includes('z4') ||
      tipo.includes('interval') || tipo.includes('intervalo')) {
    return 4;
  }
  if (tipo.includes('vo2') || tipo.includes('sprint') || tipo.includes('max') ||
      tipo.includes('z5') || tipo.includes('intenso') || tipo.includes('forte')) {
    return 5;
  }

  // Check order field for structured zone objects
  const order = typeof etapa.tipoEtapa === 'object'
    ? (etapa.tipoEtapa as { order?: number }).order
    : undefined;
  if (order != null && order >= 1 && order <= 5) return order as 1 | 2 | 3 | 4 | 5;

  return 1; // default to Z1
}

function getLabel(etapa: EtapaTreino): string {
  if (etapa.descricaoEtapa) return etapa.descricaoEtapa;
  if (typeof etapa.tipoEtapa === 'string') return etapa.tipoEtapa;
  if (typeof etapa.tipoEtapa === 'object') return (etapa.tipoEtapa as { label: string }).label ?? '';
  return `Etapa ${etapa.ordem ?? ''}`;
}

function getIconHint(zone: number, tipoLabel: string): string {
  const lower = tipoLabel.toLowerCase();
  if (lower.includes('aquecimento') || lower.includes('warmup') || lower.includes('warm')) return 'warmup';
  if (lower.includes('desaquecimento') || lower.includes('cooldown') || lower.includes('cool')) return 'cooldown';
  if (zone >= 4) return 'main';
  if (zone === 1) return 'cooldown';
  return 'main';
}

export function toWorkoutBlocks(etapas: EtapaTreino[]): WorkoutBlock[] {
  return etapas.map((etapa, index) => {
    const zone = getZoneFromEtapa(etapa);
    const zoneKey: ZoneKey = `Z${zone}` as ZoneKey;
    const label = getLabel(etapa);
    const durationMin = etapa.duracaoMin ?? 0;

    if (!etapa.duracaoMin) {
      console.warn(`[WorkoutTimelineChart] Etapa "${label}" has no duration, defaulting to 0`);
    }

    return {
      id: etapa.id ?? `etapa-${index}`,
      label,
      shortLabel: label.substring(0, 3).toUpperCase(),
      durationMin,
      zone,
      zoneKey,
      description: etapa.fcAlvoEtapa ?? etapa.observacao,
      icon: getIconHint(zone, label),
    };
  });
}
