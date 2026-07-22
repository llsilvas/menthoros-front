import { Box, Slider, Typography } from '@mui/material';
import { primary, surface } from '../../../theme/tokens';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import type { CalibracaoExtras } from '../../../types/TreinoManual';

const NIVEL_LABELS: Record<number, string> = {
    1: 'Muito baixo', 2: 'Muito baixo',
    3: 'Baixo', 4: 'Baixo',
    5: 'Moderado', 6: 'Moderado',
    7: 'Alto', 8: 'Alto',
    9: 'Muito alto', 10: 'Muito alto',
};

export interface CalibrationExtrasFieldsProps {
    value: CalibracaoExtras;
    onChange: (patch: Partial<CalibracaoExtras>) => void;
}

/**
 * Sinais extras pós-treino coletados durante `TrainingPhase.CALIBRATION` (task 8.3/8.4,
 * athlete-onboarding-baseline) — dor, fadiga, sono e recuperação, escala 1-10. Extraído de
 * `ManualTrainingForm` (correção QA 2026-07-22, achado do clean-code-reviewer): tinha coesão e
 * propósito próprios (sinais de calibração), mas vivia embutido no componente de log de treino,
 * com 4 `useState` soltos em vez de um valor composto.
 */
export function CalibrationExtrasFields({ value, onChange }: CalibrationExtrasFieldsProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} data-testid="calibracao-extras">
            <Typography sx={{ color: surface[400], fontSize: '0.8rem' }}>
                Você está na fase de calibração — esses sinais extras nos ajudam a ajustar seu plano mais rápido.
            </Typography>

            <NivelSlider label="Nível de dor" value={value.nivelDor} onChange={(v) => onChange({ nivelDor: v })} />
            <NivelSlider label="Nível de fadiga" value={value.nivelFadiga} onChange={(v) => onChange({ nivelFadiga: v })} />
            <NivelSlider
                label="Qualidade do sono (noite anterior)"
                value={value.qualidadeSonoNoiteAnterior}
                onChange={(v) => onChange({ qualidadeSonoNoiteAnterior: v })}
            />
            <NivelSlider label="Nível de recuperação" value={value.nivelRecuperacao} onChange={(v) => onChange({ nivelRecuperacao: v })} />
        </Box>
    );
}

interface NivelSliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
}

/** Slider 1–10 compartilhado pelos 4 sinais extras de calibração (dor/fadiga/sono/recuperação). */
function NivelSlider({ label, value, onChange }: NivelSliderProps) {
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <OnboardingSectionLabel>{label}</OnboardingSectionLabel>
                <Typography sx={{ color: primary[500], fontSize: '0.8rem', fontWeight: 700 }}>
                    {value}/10 — {NIVEL_LABELS[value]}
                </Typography>
            </Box>
            <Slider
                value={value}
                min={1}
                max={10}
                step={1}
                aria-label={label}
                getAriaValueText={(v) => `${v}/10 — ${NIVEL_LABELS[v]}`}
                onChange={(_e, v) => { if (typeof v === 'number') onChange(v); }}
                sx={{ color: primary[500] }}
            />
        </Box>
    );
}
