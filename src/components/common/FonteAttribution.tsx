import { Typography } from '@mui/material';
import { surface } from '../../theme/tokens';
import { rotuloGarmin } from '../../utils/rotuloGarmin';

export interface FonteAttributionProps {
    /** Os DTOs serializam a fonte como string ou como `{ value, label }` (FonteDados em OBJECT). */
    fonteDados?: string | { value: string } | null;
    deviceName?: string | null;
}

/** Modelo do dispositivo para treino vindo do Garmin; nada para as outras fontes. Sem logo (regras do tag logo). */
export function FonteAttribution({ fonteDados, deviceName }: FonteAttributionProps) {
    const fonte = typeof fonteDados === 'string' ? fonteDados : fonteDados?.value;
    if (fonte !== 'GARMIN') return null;
    return (
        <Typography variant="caption" sx={{ color: surface[400] }}>
            {rotuloGarmin(deviceName)}
        </Typography>
    );
}

export default FonteAttribution;
