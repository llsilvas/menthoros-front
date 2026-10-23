import { Box, TextField } from '@mui/material';
import type { OnboardingDraftInput, PercepcaoCondicionamento } from '../../../types/Onboarding';
import { PERCEPCAO_CONDICIONAMENTO_LABELS } from '../../../types/Onboarding';
import { DIA_SEMANA_LABELS } from '../../../types/Atleta';
import type { diaSemana } from '../../../types/Atleta';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { OnboardingChipGroup } from './OnboardingChipGroup';

const DIAS = Object.keys(DIA_SEMANA_LABELS) as diaSemana[];
const PERCEPCOES = Object.keys(PERCEPCAO_CONDICIONAMENTO_LABELS) as PercepcaoCondicionamento[];

export interface OnboardingRotinaStepProps {
    draft: OnboardingDraftInput;
    onChange: (patch: Partial<OnboardingDraftInput>) => void;
}

/**
 * Passo 2 — "Sua rotina": dias da semana (o único dado que o motor de plano exige aqui), maior
 * treino recente e como o atleta se sente — os dois opcionais.
 *
 * Duração por sessão e volume semanal máximo saíram do onboarding (decisão 2026-10-23): o
 * iniciante não sabe responder "volume máximo confortável em km" e chutava; o motor trata os dois
 * como opcionais e o treinador ajusta no perfil quando quiser. Os campos continuam no DTO.
 */
export function OnboardingRotinaStep({ draft, onChange }: OnboardingRotinaStepProps) {
    const diasSelecionados = draft.diasDisponiveis ?? [];

    const toggleDia = (dia: diaSemana) => {
        const jaSelecionado = diasSelecionados.includes(dia);
        onChange({
            diasDisponiveis: jaSelecionado
                ? diasSelecionados.filter((d) => d !== dia)
                : [...diasSelecionados, dia],
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OnboardingChipGroup
                label="Em quais dias você consegue treinar?"
                hint="Marque todos que costumam dar certo. O plano só usa esses dias."
                options={DIAS}
                labels={DIA_SEMANA_LABELS}
                selected={diasSelecionados}
                onSelect={toggleDia}
                multi
            />

            <Box>
                <OnboardingSectionLabel optional hint="Ajuda a começar o plano no tamanho certo para você.">
                    Qual foi o seu treino mais longo nas últimas semanas?
                </OnboardingSectionLabel>
                <TextField
                    type="number"
                    label="Distância (km)"
                    placeholder="Ex.: 8"
                    value={draft.maiorTreinoRecenteKm ?? ''}
                    onChange={(e) => onChange({ maiorTreinoRecenteKm: e.target.value === '' ? undefined : Number(e.target.value) })}
                    fullWidth
                    inputProps={{ min: 0.1, max: 200, step: 0.1, inputMode: 'decimal' }}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={onboardingInputSx}
                />
            </Box>

            <OnboardingChipGroup
                label="Como você sente seu condicionamento hoje?"
                optional
                options={PERCEPCOES}
                labels={PERCEPCAO_CONDICIONAMENTO_LABELS}
                selected={draft.percepcaoCondicionamento}
                onSelect={(v) => onChange({ percepcaoCondicionamento: v })}
            />
        </Box>
    );
}
