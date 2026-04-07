import type { ZoneKey } from '../../../../theme/tokens';

export interface WorkoutBlock {
  id: string;
  label: string;
  shortLabel?: string;
  durationMin: number;
  zone: 1 | 2 | 3 | 4 | 5;
  zoneKey: ZoneKey;
  description?: string;
  icon?: string;
}
