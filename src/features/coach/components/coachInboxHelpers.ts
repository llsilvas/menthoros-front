import { semantic, surface } from '../../../theme/tokens';
import type { CoachAtletaStatus } from '../../../types/Coach';
import type { DecisionState } from '../types/CoachInbox';

export function paletteForDecision(decision: DecisionState): { bg: string; fg: string; border: string; label: string } {
  if (decision === 'APPROVED') {
    return { bg: `${semantic.success[500]}1A`, fg: semantic.success[500], border: `${semantic.success[500]}44`, label: 'Aprovado' };
  }
  if (decision === 'REJECTED') {
    return { bg: `${semantic.danger[500]}1A`, fg: semantic.danger[500], border: `${semantic.danger[500]}44`, label: 'Rejeitado' };
  }
  return { bg: `${semantic.warning[500]}1A`, fg: semantic.warning[500], border: `${semantic.warning[500]}44`, label: 'Pendente' };
}

export function statusPalette(status: CoachAtletaStatus): { bg: string; fg: string; border: string } {
  if (status === 'active') {
    return { bg: `${semantic.success[500]}1A`, fg: semantic.success[500], border: `${semantic.success[500]}44` };
  }
  if (status === 'warning') {
    return { bg: `${semantic.warning[500]}1A`, fg: semantic.warning[500], border: `${semantic.warning[500]}44` };
  }
  if (status === 'danger') {
    return { bg: `${semantic.danger[500]}1A`, fg: semantic.danger[500], border: `${semantic.danger[500]}44` };
  }
  return { bg: `${surface[500]}1A`, fg: surface[300], border: `${surface[500]}44` };
}

export function statusLabel(status: CoachAtletaStatus): string {
  if (status === 'active') return 'Ativo';
  if (status === 'warning') return 'Atenção';
  if (status === 'danger') return 'Alerta';
  return 'Pausado';
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatKm(value: number): string {
  return `${value} km`;
}

export function formatDashboardDate(dateIso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' }).format(new Date(`${dateIso}T12:00:00`));
}

export function formatWorkoutTypeLabel(tipoTreino?: string): string {
  if (!tipoTreino) return 'Treino';
  return tipoTreino
    .toLowerCase()
    .replaceAll('_', ' ')
    .split(' ')
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(' ');
}
