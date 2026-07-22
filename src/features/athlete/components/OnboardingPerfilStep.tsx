import { Box, TextField } from '@mui/material';
import type { OnboardingDraftInput, CanalIntegracao, DispositivoMarca } from '../../../types/Onboarding';
import { CANAL_INTEGRACAO_LABELS, DISPOSITIVO_MARCA_LABELS } from '../../../types/Onboarding';
import { NIVEL_EXPERIENCIA_LABELS } from '../../../types/Atleta';
import type { nivelExperiencia } from '../../../types/Atleta';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { OnboardingChipGroup } from './OnboardingChipGroup';

const NIVEIS = Object.keys(NIVEL_EXPERIENCIA_LABELS) as nivelExperiencia[];
const CANAIS = Object.keys(CANAL_INTEGRACAO_LABELS) as CanalIntegracao[];
const DISPOSITIVOS = Object.keys(DISPOSITIVO_MARCA_LABELS) as DispositivoMarca[];

export interface OnboardingPerfilStepProps {
    draft: OnboardingDraftInput;
    onChange: (patch: Partial<OnboardingDraftInput>) => void;
}

/**
 * Etapa 1 — nível de experiência, dispositivo (marca + modelo opcional) e canal de integração.
 * Strava não é oferecido como opção de canal para atletas novos (ADR-0003, descontinuação
 * anunciada) — só INTERVALS_ICU e MANUAL aparecem.
 */
export function OnboardingPerfilStep({ draft, onChange }: OnboardingPerfilStepProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OnboardingChipGroup
                label="Nível de experiência"
                options={NIVEIS}
                labels={NIVEL_EXPERIENCIA_LABELS}
                selected={draft.nivelExperiencia}
                onSelect={(v) => onChange({ nivelExperiencia: v })}
            />

            <OnboardingChipGroup
                label="Marca do dispositivo/relógio"
                options={DISPOSITIVOS}
                labels={DISPOSITIVO_MARCA_LABELS}
                selected={draft.dispositivoMarca}
                onSelect={(v) => onChange({ dispositivoMarca: v })}
            />

            <Box>
                <OnboardingSectionLabel>Modelo do dispositivo (opcional)</OnboardingSectionLabel>
                <TextField
                    label="Modelo"
                    placeholder="Ex.: Forerunner 265"
                    value={draft.dispositivoModelo ?? ''}
                    onChange={(e) => onChange({ dispositivoModelo: e.target.value })}
                    fullWidth
                    sx={onboardingInputSx}
                />
            </Box>

            <OnboardingChipGroup
                label="Canal de integração de treinos"
                options={CANAIS}
                labels={CANAL_INTEGRACAO_LABELS}
                selected={draft.canalIntegracao}
                onSelect={(v) => onChange({ canalIntegracao: v })}
            />
        </Box>
    );
}
