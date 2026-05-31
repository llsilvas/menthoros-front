export const density = {
  compact:     { rowHeight: '40px', padding: '8px 12px' },   // dense tables (Athletes)
  comfortable: { rowHeight: '56px', padding: '12px 16px' },  // focused lists (Inbox)
  spacious:    { rowHeight: '72px', padding: '16px 24px' },  // hero cards, KPIs
} as const;

export const radius = {
  xs:   '4px',   // badges, pills, chips
  sm:   '6px',   // buttons, inputs
  md:   '8px',   // cards, workout blocks
  lg:   '12px',  // KPI cards, modals
  xl:   '16px',  // hero cards, large overlays
  full: '9999px', // avatars, dots
} as const;

// Base-4 spacing scale
export const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;
