import { Box, TextField } from '@mui/material';
import type { OnboardingDraftInput, CanalIntegracao, DispositivoMarca } from '../../../types/Onboarding';
import { CANAL_INTEGRACAO_LABELS, DISPOSITIVO_MARCA_LABELS } from '../../../types/Onboarding';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { OnboardingChipGroup } from './OnboardingChipGroup';

const CANAIS = Object.keys(CANAL_INTEGRACAO_LABELS) as CanalIntegracao[];
const DISPOSITIVOS = Object.keys(DISPOSITIVO_MARCA_LABELS) as DispositivoMarca[];

export interface OnboardingRelogioStepProps {
    draft: OnboardingDraftInput;
    onChange: (patch: Partial<OnboardingDraftInput>) => void;
}

/**
 * Passo 4 — relógio e sincronização. Era o passo 1 ("Perfil"): o onboarding abria com marca de
 * relógio e "canal de integração" antes de perguntar qualquer coisa sobre o atleta. A marca segue
 * obrigatória (o backend exige no rascunho, D7); modelo e canal são opcionais, e o canal ganha a
 * explicação que faltava — "intervals.icu" não diz nada para quem nunca usou.
 *
 * Strava não é oferecido como opção de canal para atletas novos (ADR-0003, descontinuação
 * anunciada) — só INTERVALS_ICU e MANUAL aparecem.
 */
export function OnboardingRelogioStep({ draft, onChange }: OnboardingRelogioStepProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OnboardingChipGroup
                label="Qual relógio ou app você usa para correr?"
                hint="Usamos para entender de onde vêm seus treinos. Sem relógio? Escolha 'Outro'."
                options={DISPOSITIVOS}
                labels={DISPOSITIVO_MARCA_LABELS}
                selected={draft.dispositivoMarca}
                onSelect={(v) => onChange({ dispositivoMarca: v })}
            />

            <Box>
                <OnboardingSectionLabel optional>Modelo</OnboardingSectionLabel>
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
                label="Como seus treinos vão chegar aqui?"
                optional
                hint="intervals.icu sincroniza sozinho a partir do relógio; Manual é você registrar cada treino. Dá para conectar depois."
                options={CANAIS}
                labels={CANAL_INTEGRACAO_LABELS}
                selected={draft.canalIntegracao}
                onSelect={(v) => onChange({ canalIntegracao: v })}
            />
        </Box>
    );
}
