import { content, semantic, surface } from '../../../theme/tokens';
import { activeTheme } from '../../../theme/activeTheme';
import type { TomDiferenca } from '../types/ExecucaoTreino';

export const MONO = activeTheme.font.mono;

export const EYEBROW_SX = {
    fontSize: '0.6875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    color: surface[400],
} as const;

export const BORDA = `1px solid ${content.divider}`;

export const corDoTom = (tom: TomDiferenca): string =>
    tom === 'ok' ? semantic.success[500] : tom === 'atencao' ? semantic.warning[500] : surface[400];
