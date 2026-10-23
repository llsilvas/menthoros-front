import { Box, TextField } from '@mui/material';
import { DISTANCIA_PROVA_LABELS } from '../../../types/Prova';
import type { DistanciaProva } from '../../../types/Prova';
import type { ProvaAlvoForm } from '../adapters/onboardingProvaAdapter';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { OnboardingChipGroup } from './OnboardingChipGroup';

// Distância livre fica fora do onboarding: só as quatro padrão, que dispensam quilometragem.
const DISTANCIAS = (Object.keys(DISTANCIA_PROVA_LABELS) as DistanciaProva[]).filter((d) => d !== 'CUSTOMIZADA');

const TEM_PROVA_OPTIONS = ['sim', 'nao'] as const;
const TEM_PROVA_LABELS: Record<(typeof TEM_PROVA_OPTIONS)[number], string> = {
    sim: 'Sim, já tenho',
    nao: 'Ainda não',
};

const PERCURSO_OPTIONS = ['rua', 'trilha'] as const;
const PERCURSO_LABELS: Record<(typeof PERCURSO_OPTIONS)[number], string> = { rua: 'Rua / asfalto', trilha: 'Trilha' };

export interface OnboardingProvaAlvoStepProps {
    value: ProvaAlvoForm;
    onChange: (patch: Partial<ProvaAlvoForm>) => void;
}

/**
 * Passo final — prova alvo (CA13, cria/atualiza uma Prova real ao concluir). Opcional desde
 * improve-athlete-onboarding-usability: "Ainda não" conclui sem prova, e o atleta cadastra depois.
 *
 * Não pergunta "tipo da prova": deriva da distância e do percurso (ver `inferirTipoProva`) —
 * "Meia Maratona" e "21 km" eram duas perguntas para a mesma resposta.
 */
export function OnboardingProvaAlvoStep({ value, onChange }: OnboardingProvaAlvoStepProps) {
    const temProvaSelecionado = value.temProva === undefined ? undefined : (value.temProva ? 'sim' : 'nao');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OnboardingChipGroup
                label="Você já tem uma prova em vista?"
                hint="Se não tiver, tudo bem: o plano começa pelo seu objetivo e a prova entra quando você quiser."
                options={TEM_PROVA_OPTIONS}
                labels={TEM_PROVA_LABELS}
                selected={temProvaSelecionado}
                onSelect={(v) => onChange({ temProva: v === 'sim' })}
            />

            {value.temProva && (
                <>
                    <Box>
                        <OnboardingSectionLabel>Quando é a prova?</OnboardingSectionLabel>
                        <TextField
                            type="date"
                            label="Data da prova"
                            value={value.dataProva ?? ''}
                            onChange={(e) => onChange({ dataProva: e.target.value || undefined })}
                            fullWidth
                            inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                            // Sem `shrink`, o rótulo fica por cima do "mm/dd/yyyy" do campo nativo.
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={onboardingInputSx}
                        />
                    </Box>

                    <OnboardingChipGroup
                        label="Qual a distância?"
                        options={DISTANCIAS}
                        labels={DISTANCIA_PROVA_LABELS}
                        selected={value.distancia}
                        onSelect={(v) => onChange({ distancia: v })}
                    />

                    <OnboardingChipGroup
                        label="Percurso"
                        optional
                        options={PERCURSO_OPTIONS}
                        labels={PERCURSO_LABELS}
                        selected={value.trilha === undefined ? undefined : (value.trilha ? 'trilha' : 'rua')}
                        onSelect={(v) => onChange({ trilha: v === 'trilha' })}
                    />

                    <Box>
                        <OnboardingSectionLabel optional>Nome da prova</OnboardingSectionLabel>
                        <TextField
                            label="Nome da prova"
                            placeholder="Ex.: Meia Maratona de Floripa"
                            value={value.nomeProva ?? ''}
                            onChange={(e) => onChange({ nomeProva: e.target.value.slice(0, 200) })}
                            fullWidth
                            sx={onboardingInputSx}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
}
