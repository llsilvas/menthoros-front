import { useState } from 'react';
import { Box, TextField } from '@mui/material';
import type { OnboardingDraftInput } from '../../../types/Onboarding';
import { OBJETIVO_PRESETS } from '../../../types/Onboarding';
import { NIVEL_EXPERIENCIA_LABELS } from '../../../types/Atleta';
import type { nivelExperiencia } from '../../../types/Atleta';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { OnboardingChipGroup } from './OnboardingChipGroup';

const NIVEIS = Object.keys(NIVEL_EXPERIENCIA_LABELS) as nivelExperiencia[];

const OUTRO = 'OUTRO' as const;
type ObjetivoOpcao = (typeof OBJETIVO_PRESETS)[number] | typeof OUTRO;
const OBJETIVO_OPCOES: readonly ObjetivoOpcao[] = [...OBJETIVO_PRESETS, OUTRO];
const OBJETIVO_LABELS: Record<ObjetivoOpcao, string> = {
    ...Object.fromEntries(OBJETIVO_PRESETS.map((p) => [p, p])) as Record<(typeof OBJETIVO_PRESETS)[number], string>,
    [OUTRO]: 'Outro',
};

const NIVEL_HINT = 'Iniciante: começando agora ou correndo há menos de um ano.';

export interface OnboardingSobreVoceStepProps {
    draft: OnboardingDraftInput;
    onChange: (patch: Partial<OnboardingDraftInput>) => void;
}

function ehPreset(objetivo: string | undefined): objetivo is (typeof OBJETIVO_PRESETS)[number] {
    return (OBJETIVO_PRESETS as readonly string[]).includes(objetivo ?? '');
}

/**
 * Passo 1 — "Você": nível de experiência e objetivo. O onboarding abria perguntando marca de
 * relógio e "canal de integração"; o atleta falar de si primeiro é o que dá sentido ao resto.
 *
 * O objetivo vira chips prontos: redigir num campo vazio ("Qual é o seu objetivo?") travava o
 * iniciante, e o motor de plano só precisa de UMA string em `objetivo`. "Outro" abre o campo livre.
 */
export function OnboardingSobreVoceStep({ draft, onChange }: OnboardingSobreVoceStepProps) {
    // Sem isto, limpar o campo livre voltaria para "nenhum chip" e esconderia o próprio campo.
    const [outroAberto, setOutroAberto] = useState(() => Boolean(draft.objetivo) && !ehPreset(draft.objetivo));
    const opcaoSelecionada: ObjetivoOpcao | undefined = outroAberto
        ? OUTRO
        : ehPreset(draft.objetivo) ? draft.objetivo : undefined;

    const escolherObjetivo = (opcao: ObjetivoOpcao) => {
        if (opcao === OUTRO) {
            setOutroAberto(true);
            if (ehPreset(draft.objetivo)) onChange({ objetivo: '' });
            return;
        }
        setOutroAberto(false);
        onChange({ objetivo: opcao });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OnboardingChipGroup
                label="Há quanto tempo você corre?"
                hint={NIVEL_HINT}
                options={NIVEIS}
                labels={NIVEL_EXPERIENCIA_LABELS}
                selected={draft.nivelExperiencia}
                onSelect={(v) => onChange({ nivelExperiencia: v })}
            />

            <OnboardingChipGroup
                label="O que você quer com o treino?"
                hint="É o que orienta o seu plano. Dá para mudar depois."
                options={OBJETIVO_OPCOES}
                labels={OBJETIVO_LABELS}
                selected={opcaoSelecionada}
                onSelect={escolherObjetivo}
            />

            {outroAberto && (
                <Box>
                    <OnboardingSectionLabel>Conte com suas palavras</OnboardingSectionLabel>
                    <TextField
                        multiline
                        rows={2}
                        label="Seu objetivo"
                        placeholder="Ex.: Fazer a meia de Floripa abaixo de 2h"
                        value={draft.objetivo ?? ''}
                        onChange={(e) => onChange({ objetivo: e.target.value.slice(0, 500) })}
                        fullWidth
                        autoFocus
                        helperText={`${(draft.objetivo ?? '').length}/500`}
                        sx={onboardingInputSx}
                    />
                </Box>
            )}
        </Box>
    );
}
