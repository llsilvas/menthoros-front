import { surface } from './colors';

// Dark-mode elevation via background shift (not shadows).
export const elevation = {
  base:    surface[900], // '#0A1628' — canvas, sidebar
  panel:   surface[850], // '#0E1B30' — columns, side panels
  card:    surface[800], // '#131F35' — cards, table rows hover
  highest: '#1A2940',    // selected state, modals, dropdowns, command palette
} as const;

export const shadow = {
  modal:    '0 16px 32px rgba(0, 0, 0, 0.4)',
  dropdown: '0 4px 12px rgba(0, 0, 0, 0.3)',
} as const;
