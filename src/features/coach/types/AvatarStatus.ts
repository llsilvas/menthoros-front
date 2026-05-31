import { semantic, surface } from '../../../shared/design-tokens';

export type AvatarStatus =
  | 'pending_validation' // warning-500 (amber) — AI suggestion awaiting coach review
  | 'alert_high'         // danger-500 (red)   — critical alert: overtraining, reported injury
  | 'alert_medium'       // warning-400 (amber light) — mild signal: low recovery, poor sleep
  | 'synced_recent'      // success-500 (emerald) — synced within last 24h
  | 'no_sync'            // surface-400 (gray) — no sync for > 3 days
  | 'none';              // no dot shown

export const avatarStatusColor: Record<Exclude<AvatarStatus, 'none'>, string> = {
  pending_validation: semantic.warning[500],
  alert_high:         semantic.danger[500],
  alert_medium:       semantic.warning[400],
  synced_recent:      semantic.success[500],
  no_sync:            surface[400],
};
