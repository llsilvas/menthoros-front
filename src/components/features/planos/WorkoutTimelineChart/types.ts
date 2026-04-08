import type { ZoneKey } from '../../../../theme/tokens';

export type BlockType = 'warmup' | 'main' | 'cooldown' | 'interval' | 'recovery';

export interface WorkoutBlock {
  id: string;
  label: string;
  shortLabel?: string;
  durationMin: number;
  zone: 1 | 2 | 3 | 4 | 5;
  zoneKey: ZoneKey;
  blockType?: BlockType;
  description?: string;
  icon?: string;
}
