// 7-level canonical typography scale. Components MUST use these tokens — no arbitrary sizes.
export const typography = {
  xs:      { fontSize: '11px', lineHeight: '14px', fontWeight: 400, letterSpacing: '0.04em' }, // badges, micro labels
  sm:      { fontSize: '13px', lineHeight: '18px', fontWeight: 400 },                          // table cells, secondary
  base:    { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },                          // body, primary labels
  lg:      { fontSize: '16px', lineHeight: '22px', fontWeight: 500 },                          // card titles
  xl:      { fontSize: '18px', lineHeight: '24px', fontWeight: 600 },                          // section headers
  '2xl':   { fontSize: '24px', lineHeight: '32px', fontWeight: 600 },                          // page titles
  display: { fontSize: '32px', lineHeight: '36px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' as const }, // KPI hero
} as const;

export type TypographyLevel = keyof typeof typography;
