import { useEffect } from 'react';
import { Box, TextField } from '@mui/material';
import type { OnboardingDraftInput, CanalIntegracao, DispositivoMarca } from '../../../types/Onboarding';
import { CANAL_INTEGRACAO_LABELS, DISPOSITIVO_MARCA_LABELS } from '../../../types/Onboarding';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { OnboardingChipGroup } from './OnboardingChipGroup';
import { runtimeConfig } from '../../../config/env';

const CANAIS_GERAIS: CanalIntegracao[] = ['INTERVALS_ICU', 'MANUAL'];

/**
 * D9 de garmin-connection: com o canal direto habilitado, relógio Garmin só tem o canal GARMIN e as
 * demais marcas nunca o veem. É rede de segurança de UX — o backend rejeita a combinação errada.
 */
function canaisPara(marca: DispositivoMarca | undefined): CanalIntegracao[] {
    return runtimeConfig.garminHabilitado && marca === 'GARMIN' ? ['GARMIN'] : CANAIS_GERAIS;
}
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
 * anunciada) — só INTERVALS_ICU e MANUAL aparecem; GARMIN só para relógio Garmin, com o canal direto
 * habilitado.
 */
export function OnboardingRelogioStep({ draft, onChange }: OnboardingRelogioStepProps) {
    const canais = canaisPara(draft.dispositivoMarca);
    const canalValido = draft.canalIntegracao !== undefined && canais.includes(draft.canalIntegracao);

    // Rascunho retomado com canal que a marca não admite (ex.: Garmin + intervals.icu, salvo antes da
    // flag) ou sem canal quando só há uma opção válida: corrige aqui, senão o backend devolveria 422
    // no salvamento. Sem marca ainda, não há o que corrigir.
    useEffect(() => {
        if (draft.dispositivoMarca === undefined) return;
        if (draft.canalIntegracao === undefined) {
            if (canais.length === 1) onChange({ canalIntegracao: canais[0] });
            return;
        }
        if (canalValido) return;
        onChange({ canalIntegracao: canais.length === 1 ? canais[0] : undefined });
    }, [draft.dispositivoMarca, draft.canalIntegracao, canalValido, canais, onChange]);

    const selecionarMarca = (marca: DispositivoMarca) => {
        const novosCanais = canaisPara(marca);
        const patch: Partial<OnboardingDraftInput> = { dispositivoMarca: marca };
        if (novosCanais.length === 1 && draft.canalIntegracao !== novosCanais[0]) {
            patch.canalIntegracao = novosCanais[0];
        } else if (draft.canalIntegracao !== undefined && !novosCanais.includes(draft.canalIntegracao)) {
            patch.canalIntegracao = undefined;
        }
        onChange(patch);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OnboardingChipGroup
                label="Qual relógio ou app você usa para correr?"
                hint="Usamos para entender de onde vêm seus treinos. Sem relógio? Escolha 'Outro'."
                options={DISPOSITIVOS}
                labels={DISPOSITIVO_MARCA_LABELS}
                selected={draft.dispositivoMarca}
                onSelect={selecionarMarca}
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
                hint={
                    canais[0] === 'GARMIN'
                        ? 'Conectamos direto à sua conta Garmin: os treinos vão ao relógio e voltam sozinhos. Dá para conectar depois.'
                        : 'intervals.icu sincroniza sozinho a partir do relógio; Manual é você registrar cada treino. Dá para conectar depois.'
                }
                options={canais}
                labels={CANAL_INTEGRACAO_LABELS}
                selected={canalValido ? draft.canalIntegracao : undefined}
                onSelect={(v) => onChange({ canalIntegracao: v })}
            />
        </Box>
    );
}
